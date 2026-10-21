/**
 * Real-SDK tests (no `ai` mock): a caller abort and the per-turn watchdog
 * resolve as a classified stopped turn holding the streamed text, not as a
 * thrown error.
 */
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { describe, expect, it } from "vitest";

import { runTurn } from "./run-turn";

const slowTextModel = (deltas: string[], chunkDelayInMs: number) =>
  new MockLanguageModelV4({
    doStream: async () =>
      ({
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs,
          chunks: [
            { type: "stream-start", warnings: [] },
            { type: "text-start", id: "t" },
            ...deltas.map((delta) => ({ type: "text-delta", id: "t", delta })),
            { type: "text-end", id: "t" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: "stop" },
              usage: { inputTokens: { total: 4 }, outputTokens: { total: 3 } },
            },
          ],
        }),
      }) as never,
  });

const messages = [{ role: "user" as const, content: "hola" }];
const SLOW_CHUNK_MS = 20;
const FAST_CHUNK_MS = 5;
const STEADY_CHUNK_MS = 40;
const IDLE_MS = 100;

/** Streams one delta, then never sends another chunk nor closes. */
const stallingModel = (delta: string) =>
  new MockLanguageModelV4({
    doStream: async () =>
      ({
        stream: new ReadableStream({
          start: (controller) => {
            controller.enqueue({ type: "stream-start", warnings: [] });
            controller.enqueue({ type: "text-start", id: "t" });
            controller.enqueue({ type: "text-delta", id: "t", delta });
          },
        }),
      }) as never,
  });

describe("runTurn stop paths", () => {
  it("should resolve an aborted turn keeping the text streamed before the stop", async () => {
    // Arrange
    const controller = new AbortController();
    const model = slowTextModel(["Hola ", "mundo ", "entero"], SLOW_CHUNK_MS);
    const seen: string[] = [];

    // Act
    const raw = await runTurn({
      model,
      messages,
      tools: {},
      maxSteps: 8,
      abortSignal: controller.signal,
      onTextDelta: (d) => {
        seen.push(d);
        controller.abort();
      },
    });

    // Assert
    expect(raw.stopped).toBe("aborted");
    expect(raw.text).toBe("Hola ");
    expect(raw.toolCalls).toEqual([]);
    expect(raw.messages).toEqual([{ role: "assistant", content: "Hola " }]);
    expect(seen).toEqual(["Hola "]);
  });

  it("should resolve with an empty turn when the signal is already aborted", async () => {
    // Arrange
    const controller = new AbortController();
    controller.abort();

    // Act
    const raw = await runTurn({
      model: slowTextModel(["never"], FAST_CHUNK_MS),
      messages,
      tools: {},
      maxSteps: 8,
      abortSignal: controller.signal,
    });

    // Assert
    expect(raw.stopped).toBe("aborted");
    expect(raw.text).toBe("");
    expect(raw.messages).toEqual([]);
  });

  it("should time out when the stream goes silent past the idle window", async () => {
    // Arrange
    const model = stallingModel("Hola ");

    // Act
    const raw = await runTurn({
      model,
      messages,
      tools: {},
      maxSteps: 8,
      idleTimeoutMs: IDLE_MS,
    });

    // Assert
    expect(raw.stopped).toBe("timeout");
    expect(raw.text).toBe("Hola ");
    expect(raw.messages).toEqual([{ role: "assistant", content: "Hola " }]);
  });

  it("should not time out a turn that keeps streaming longer than the idle window", async () => {
    // Arrange
    const deltas = ["a", "b", "c", "d", "e", "f"];
    const model = slowTextModel(deltas, STEADY_CHUNK_MS);

    // Act
    const raw = await runTurn({
      model,
      messages,
      tools: {},
      maxSteps: 8,
      idleTimeoutMs: IDLE_MS,
    });

    // Assert
    expect(raw.stopped).toBeUndefined();
    expect(raw.text).toBe(deltas.join(""));
    expect(raw.steps).toBe(1);
    expect(raw.usage).toEqual({ promptTokens: 4, completionTokens: 3 });
  });
});
