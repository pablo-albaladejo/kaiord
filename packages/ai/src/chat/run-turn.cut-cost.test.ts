/**
 * Real-SDK tests (no `ai` mock): a step cut before the Provider reported its
 * usage was still billed. The SDK reports usage only with a step's final
 * chunk, so the cut step carries an estimate from the request's text and the
 * text streamed so far, marked `estimated`, never nothing.
 */
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import { runTurn } from "./run-turn";
import { turnMetricsOf } from "./turn-stats";

const SYSTEM = "You are a coach.";
const messages = [{ role: "user" as const, content: "hola" }];
// 16 system + 4 user characters, at 3 characters per token, rounded up.
const REQUEST_TOKENS = 7;
const CUT_AFTER_MS = 10;

/** Streams one delta, then fails or stalls as `then` says. */
const cutModel = (delta: string, then: "stall" | "network") =>
  new MockLanguageModelV4({
    doStream: async () =>
      ({
        stream: new ReadableStream({
          start: (controller) => {
            controller.enqueue({ type: "stream-start", warnings: [] });
            controller.enqueue({ type: "text-start", id: "t" });
            controller.enqueue({ type: "text-delta", id: "t", delta });
            // Erroring drops what is still queued, so the cut comes later.
            if (then === "network")
              setTimeout(
                () =>
                  controller.error(new TypeError("network connection lost")),
                CUT_AFTER_MS
              );
          },
        }),
      }) as never,
  });

describe("runTurn cost of a cut step", () => {
  it("should record a watchdog timeout as a failed request with an estimate", async () => {
    // Arrange
    const model = cutModel("Hola mundo", "stall");

    // Act
    const raw = await runTurn({
      model,
      system: SYSTEM,
      messages,
      tools: {},
      maxSteps: 8,
      idleTimeoutMs: 50,
    });

    // Assert
    expect(raw.stopped).toBe("timeout");
    expect(raw.requests).toEqual([
      {
        outcome: "error",
        estimated: true,
        usage: { promptTokens: REQUEST_TOKENS, completionTokens: 4 },
      },
    ]);
  });

  it("should record a Stop as a stopped request that is still estimated", async () => {
    // Arrange
    const controller = new AbortController();
    const model = cutModel("Hola mundo", "stall");

    // Act
    const raw = await runTurn({
      model,
      system: SYSTEM,
      messages,
      tools: {},
      maxSteps: 8,
      abortSignal: controller.signal,
      onTextDelta: () => controller.abort(),
    });

    // Assert
    expect(raw.stopped).toBe("aborted");
    expect(raw.requests).toEqual([
      {
        outcome: "stopped",
        estimated: true,
        usage: { promptTokens: REQUEST_TOKENS, completionTokens: 4 },
      },
    ]);
  });

  it("should record a network cut mid-stream as a failed request with an estimate", async () => {
    // Arrange
    const model = cutModel("Hola mundo", "network");

    // Act
    const error = await runTurn({
      model,
      system: SYSTEM,
      messages,
      tools: {},
      maxSteps: 8,
    }).catch((e: unknown) => e);

    // Assert
    expect(turnMetricsOf(error)?.requests).toEqual([
      {
        outcome: "error",
        estimated: true,
        usage: { promptTokens: REQUEST_TOKENS, completionTokens: 4 },
      },
    ]);
  });
});
