/**
 * Real-SDK tests: an attempt cut before the Provider reported its usage was
 * still billed, so it is estimated from the request's text and the output
 * streamed before the cut, and marked `estimated`.
 */
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createRingBufferTelemetrySink } from "../observability/ring-buffer-sink";
import { definePrompt } from "../prompts/registry";
import { jsonResult, jsonStream } from "../test-utils/mock-language-model";
import type { AgentDefinition } from "./definition-types";
import { runGenerateAgent } from "./runtime";

const SYSTEM = "prompt body";
definePrompt({
  id: "test/cut-cost",
  version: "1.0.0",
  template: SYSTEM,
  variables: [],
});

const AGENT: AgentDefinition<{ n: number }> = {
  id: "cut-cost-agent",
  version: "1.0.0",
  purpose: "workout_generation",
  systemPrompt: { id: "test/cut-cost" },
  mode: "generate",
  outputSchema: z.object({ n: z.number() }),
};

// "prompt body" and the user text "x": 12 characters, 3 per token.
const SENT_TOKENS = 4;
const PARTIAL = '{"n":';
const CUT_AFTER_MS = 10;
const STOP_AFTER_MS = 20;

/** Streams a partial output, then drops the connection or waits for a stop. */
const cutStream =
  (then: "network" | "stall") =>
  async ({ abortSignal }: { abortSignal?: AbortSignal }) => ({
    stream: new ReadableStream({
      start: (controller) => {
        controller.enqueue({ type: "stream-start", warnings: [] });
        controller.enqueue({ type: "text-start", id: "t" });
        controller.enqueue({ type: "text-delta", id: "t", delta: PARTIAL });
        const cut = (reason: unknown) =>
          setTimeout(() => controller.error(reason), CUT_AFTER_MS);
        if (then === "network") cut(new TypeError("network connection lost"));
        else
          abortSignal?.addEventListener("abort", () => cut(abortSignal.reason));
      },
    }),
  });

const run = async (
  model: MockLanguageModelV4,
  options: { signal?: AbortSignal; streaming?: boolean } = {}
) => {
  const telemetry = createRingBufferTelemetrySink();
  await runGenerateAgent(
    AGENT,
    { text: "x" },
    {
      model,
      telemetry,
      signal: options.signal,
      ...(options.streaming === false ? {} : { onProgress: () => undefined }),
    }
  ).catch(() => undefined);
  return telemetry.events()[0]!;
};

describe("runGenerateAgent cost of a cut attempt", () => {
  it("should estimate a streamed attempt cut by a dropped connection as a failed request", async () => {
    // Arrange
    let calls = 0;
    const model = new MockLanguageModelV4({
      doStream: (async (options: { abortSignal?: AbortSignal }) => {
        calls += 1;
        return calls === 1
          ? cutStream("network")(options)
          : jsonStream(['{"n":1}']);
      }) as never,
    });

    // Act
    const event = await run(model);

    // Assert
    expect(event.requests[0]).toEqual({
      outcome: "error",
      estimated: true,
      usage: { promptTokens: SENT_TOKENS, completionTokens: 2 },
    });
  });

  it("should estimate a streamed attempt the athlete stopped, kept as stopped", async () => {
    // Arrange
    const controller = new AbortController();
    const model = new MockLanguageModelV4({
      doStream: cutStream("stall") as never,
    });
    setTimeout(() => controller.abort(), STOP_AFTER_MS);

    // Act
    const event = await run(model, { signal: controller.signal });

    // Assert
    expect(event.requests).toEqual([
      {
        outcome: "stopped",
        estimated: true,
        usage: { promptTokens: SENT_TOKENS, completionTokens: 2 },
      },
    ]);
  });

  it("should estimate the input of a one-shot attempt the athlete stopped", async () => {
    // Arrange
    const controller = new AbortController();
    const model = new MockLanguageModelV4({
      doGenerate: (async ({ abortSignal }: { abortSignal?: AbortSignal }) => {
        controller.abort();
        abortSignal?.throwIfAborted();
        return jsonResult({ n: 1 });
      }) as never,
    });

    // Act
    const event = await run(model, {
      signal: controller.signal,
      streaming: false,
    });

    // Assert
    expect(event.requests).toEqual([
      {
        outcome: "stopped",
        estimated: true,
        usage: { promptTokens: SENT_TOKENS, completionTokens: 0 },
      },
    ]);
  });
});
