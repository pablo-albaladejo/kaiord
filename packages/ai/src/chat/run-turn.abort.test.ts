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
const STALLED_CHUNK_MS = 40;

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

  it("should resolve a timeout turn when the watchdog deadline passes mid-stream", async () => {
    // Arrange
    const model = slowTextModel(
      ["a", "b", "c", "d", "e", "f"],
      STALLED_CHUNK_MS
    );

    // Act
    const raw = await runTurn({
      model,
      messages,
      tools: {},
      maxSteps: 8,
      timeoutMs: 100,
    });

    // Assert
    expect(raw.stopped).toBe("timeout");
    expect(raw.text.length).toBeGreaterThan(0);
    expect(raw.text.length).toBeLessThan("abcdef".length);
  });

  it("should complete normally when the stream ends before the deadline", async () => {
    // Arrange
    const model = slowTextModel(["ok"], 1);

    // Act
    const raw = await runTurn({
      model,
      messages,
      tools: {},
      maxSteps: 8,
      timeoutMs: 5_000,
    });

    // Assert
    expect(raw.stopped).toBeUndefined();
    expect(raw.text).toBe("ok");
    expect(raw.steps).toBe(1);
    expect(raw.usage).toEqual({ promptTokens: 4, completionTokens: 3 });
  });
});
