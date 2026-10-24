import { APICallError, UnsupportedFunctionalityError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { definePrompt } from "../prompts/registry";
import {
  ATTEMPTS_THREE,
  EXPECTED_STEP_COUNT_THREE,
  HTTP_STATUS_UNAUTHORIZED,
} from "../test-utils/constants";
import { jsonResult, jsonStream } from "../test-utils/mock-language-model";
import type { AgentDefinition } from "./definition-types";
import type { GenerateProgress } from "./progress";
import { runGenerateLoop } from "./generate-mode";
import { runGenerateAgent } from "./runtime";

definePrompt({
  id: "test/progress",
  version: "1.0.0",
  template: "SYSTEM",
  variables: [],
});

const AGENT: AgentDefinition<{ steps: number[] }> = {
  id: "progress-agent",
  version: "1.0.0",
  purpose: "default",
  systemPrompt: { id: "test/progress" },
  mode: "generate",
  outputSchema: z.object({ steps: z.array(z.number()) }),
  validate: (raw) => z.object({ steps: z.array(z.number()).min(1) }).parse(raw),
  countItems: (partial) => (partial as { steps?: unknown[] }).steps?.length,
};

const FALLBACK_STEP = 9;

const recorder = () => {
  const events: GenerateProgress[] = [];
  return { events, onProgress: (p: GenerateProgress) => events.push(p) };
};

describe("runGenerateAgent progress", () => {
  it("should report requesting, growing item counts, then validating", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [jsonStream(['{"steps":[1,', "2,", "3", "]}"])],
    });
    const { events, onProgress } = recorder();

    // Act
    const result = await runGenerateAgent(
      AGENT,
      { text: "go" },
      { model, onProgress }
    );

    // Assert
    expect(result.output.steps).toHaveLength(EXPECTED_STEP_COUNT_THREE);
    expect(events.map((e) => [e.phase, e.items])).toEqual([
      ["requesting", undefined],
      ["generating", 1],
      ["generating", 2],
      ["generating", EXPECTED_STEP_COUNT_THREE],
      ["validating", undefined],
    ]);
    expect(
      events.every((e) => e.attempt === 1 && e.maxAttempts === ATTEMPTS_THREE)
    ).toBe(true);
  });

  it("should report the attempt number of a schema-repair retry", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [jsonStream(['{"steps":[]}']), jsonStream(['{"steps":[4]}'])],
    });
    const { events, onProgress } = recorder();

    // Act
    await runGenerateAgent(AGENT, { text: "go" }, { model, onProgress });

    // Assert
    expect(events).toContainEqual({
      phase: "requesting",
      attempt: 2,
      maxAttempts: 3,
      retryReason: "invalid",
    });
    expect(JSON.stringify(model.doStreamCalls[1]?.prompt)).toContain(
      "Previous attempt failed"
    );
  });

  it("should fall back to one-shot generation when the model cannot stream", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new UnsupportedFunctionalityError({ functionality: "stream" });
      },
      doGenerate: [jsonResult({ steps: [FALLBACK_STEP] })],
    });
    const { events, onProgress } = recorder();

    // Act
    const result = await runGenerateAgent(
      AGENT,
      { text: "go" },
      { model, onProgress }
    );

    // Assert
    expect(result.output.steps).toEqual([FALLBACK_STEP]);
    expect(model.doGenerateCalls).toHaveLength(1);
    expect(events.map((e) => e.phase)).toEqual(["requesting"]);
  });

  it("should not stream when no progress listener is given", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doGenerate: [jsonResult({ steps: [1] })],
    });

    // Act
    await runGenerateAgent(AGENT, { text: "go" }, { model });

    // Assert
    expect(model.doStreamCalls).toHaveLength(0);
    expect(model.doGenerateCalls).toHaveLength(1);
  });

  it("should rethrow a streamed provider error with its status, without retrying", async () => {
    // Arrange
    const error = new APICallError({
      message: "unauthorized",
      url: "https://api.example.com/v1",
      requestBodyValues: {},
      statusCode: HTTP_STATUS_UNAUTHORIZED,
      isRetryable: false,
    });
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw error;
      },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { events, onProgress } = recorder();

    // Act
    const run = runGenerateAgent(AGENT, { text: "go" }, { model, onProgress });

    // Assert
    await expect(run).rejects.toBe(error);
    expect(model.doStreamCalls).toHaveLength(1);
    expect(consoleError).not.toHaveBeenCalled();
    expect(events.map((e) => e.phase)).toEqual(["requesting"]);
    consoleError.mockRestore();
  });

  it("should stop a streaming run when its signal aborts mid-output", async () => {
    // Arrange
    const controller = new AbortController();
    const model = new MockLanguageModelV4({
      doStream: async ({ abortSignal }) =>
        ({
          stream: new ReadableStream({
            start(c) {
              c.enqueue({ type: "stream-start", warnings: [] });
              c.enqueue({ type: "text-start", id: "t" });
              c.enqueue({ type: "text-delta", id: "t", delta: '{"steps":[1,' });
              abortSignal?.addEventListener("abort", () =>
                c.error(abortSignal.reason)
              );
            },
          }),
        }) as never,
    });
    const onProgress = (p: GenerateProgress) => {
      if (p.phase === "generating") controller.abort();
    };

    // Act
    const run = runGenerateAgent(
      AGENT,
      { text: "go" },
      { model, onProgress, signal: controller.signal }
    );

    // Assert
    await expect(run).rejects.toMatchObject({ name: "AbortError" });
    expect(model.doStreamCalls).toHaveLength(1);
  });

  it("should not report validating when the signal aborts mid-stream", async () => {
    // Arrange
    const controller = new AbortController();
    const model = new MockLanguageModelV4({
      doStream: [jsonStream(['{"steps":[1,', "2", "]}"])],
    });
    const events: GenerateProgress[] = [];
    const onProgress = (p: GenerateProgress) => {
      events.push(p);
      if (p.phase === "generating") controller.abort();
    };

    // Act
    const run = runGenerateAgent(
      AGENT,
      { text: "go" },
      { model, onProgress, signal: controller.signal }
    );

    // Assert
    await expect(run).rejects.toThrow();
    expect(events.map((e) => e.phase)).not.toContain("validating");
  });

  it("should stop without retrying when aborted with a non-AbortError reason", async () => {
    // Arrange
    const controller = new AbortController();
    const model = new MockLanguageModelV4({
      doStream: [jsonStream(['{"steps":[1,', "2", "]}"])],
    });
    const onAttemptError = vi.fn();
    const onProgress = (p: GenerateProgress) => {
      if (p.phase === "generating") controller.abort(new Error("user left"));
    };

    // Act
    const run = runGenerateLoop({
      model,
      system: "SYSTEM",
      input: { text: "go" },
      definition: AGENT,
      signal: controller.signal,
      onProgress,
      onAttemptError,
    });

    // Assert
    await expect(run).rejects.toThrow("user left");
    expect(onAttemptError).not.toHaveBeenCalled();
    expect(model.doStreamCalls).toHaveLength(1);
  });
});
