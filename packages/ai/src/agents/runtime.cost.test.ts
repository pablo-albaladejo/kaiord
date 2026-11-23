import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createRingBufferTelemetrySink } from "../observability/ring-buffer-sink";
import { definePrompt } from "../prompts/registry";
import { jsonResult, jsonStream } from "../test-utils/mock-language-model";
import type { AgentDefinition } from "./definition-types";
import { runGenerateAgent } from "./runtime";

definePrompt({
  id: "test/cost",
  version: "1.0.0",
  template: "prompt body",
  variables: [],
});

const AGENT: AgentDefinition<{ n: number }> = {
  id: "cost-agent",
  version: "1.0.0",
  purpose: "workout_generation",
  systemPrompt: { id: "test/cost" },
  mode: "generate",
  outputSchema: z.object({ n: z.number().optional() }),
  validate: (raw) => z.object({ n: z.number() }).parse(raw),
};

const modelOf = (doGenerate: unknown[]) =>
  new MockLanguageModelV4({
    modelId: "m",
    provider: "p",
    doGenerate: doGenerate as never,
  });

const serverError = () =>
  new APICallError({
    message: "overloaded",
    url: "https://provider.test",
    requestBodyValues: {},
    statusCode: 529,
    isRetryable: true,
  });

const run = (model: MockLanguageModelV4, streaming = false) => {
  const telemetry = createRingBufferTelemetrySink();
  const done = runGenerateAgent(
    AGENT,
    { text: "x" },
    {
      model,
      telemetry,
      ...(streaming ? { onProgress: () => undefined } : {}),
    }
  ).catch(() => undefined);
  return done.then(() => telemetry.events()[0]!);
};

describe("runGenerateAgent cost reporting", () => {
  it("should report the billed usage of a validation retry, not only the attempt that passed", async () => {
    // Arrange
    const model = modelOf([
      jsonResult({}, { input: 100, output: 40 }),
      jsonResult({ n: 1 }, { input: 120, output: 30 }),
    ]);

    // Act
    const event = await run(model);

    // Assert
    expect(event).toMatchObject({
      type: "run_finished",
      requests: [
        {
          outcome: "invalid",
          usage: { promptTokens: 100, completionTokens: 40 },
        },
        { outcome: "ok", usage: { promptTokens: 120, completionTokens: 30 } },
      ],
      usage: { promptTokens: 220, completionTokens: 70 },
    });
  });

  it("should report every billed attempt of a run that failed", async () => {
    // Arrange
    const model = modelOf([jsonResult({}), jsonResult({}), jsonResult({})]);

    // Act
    const event = await run(model);

    // Assert
    expect(event.type).toBe("run_failed");
    expect(event).toMatchObject({
      requests: [
        { outcome: "invalid", usage: { promptTokens: 10 } },
        { outcome: "invalid", usage: { promptTokens: 10 } },
        { outcome: "invalid", usage: { promptTokens: 10 } },
      ],
    });
  });

  it("should report a Provider failure with no usage as an unmeasured request", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doGenerate: async () => {
        if (model.doGenerateCalls.length === 1) throw serverError();
        return jsonResult({ n: 1 });
      },
    });

    // Act
    const event = await run(model);

    // Assert
    expect(event).toMatchObject({
      type: "run_finished",
      requests: [{ outcome: "error" }, { outcome: "ok" }],
    });
    expect(
      event.type === "run_finished" && event.requests[0]
    ).not.toHaveProperty("usage");
  });

  it("should report a streamed attempt that did not validate with its usage", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doStream: [jsonStream(["{}"]), jsonStream(['{"n":', "1}"])],
    });

    // Act
    const event = await run(model, true);

    // Assert
    expect(event).toMatchObject({
      type: "run_finished",
      requests: [
        {
          outcome: "invalid",
          usage: { promptTokens: 10, completionTokens: 5 },
        },
        { outcome: "ok", usage: { promptTokens: 10, completionTokens: 5 } },
      ],
    });
  });

  it("should report a streamed attempt cut at the token limit with its usage", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doStream: [
        jsonStream(['{"n":'], { finishReason: "length" }),
        jsonStream(['{"n":1}']),
      ],
    });

    // Act
    const event = await run(model, true);

    // Assert
    expect(event).toMatchObject({
      requests: [
        { outcome: "truncated", usage: { completionTokens: 5 } },
        { outcome: "ok" },
      ],
    });
  });

  it("should report the cache read and write tokens the Provider returns", async () => {
    // Arrange
    const cached = {
      ...(jsonResult({ n: 1 }) as object),
      usage: {
        inputTokens: { total: 100, noCache: 50, cacheRead: 40, cacheWrite: 10 },
        outputTokens: { total: 5 },
      },
    };
    const model = modelOf([cached]);

    // Act
    const event = await run(model);

    // Assert
    expect(event).toMatchObject({
      requests: [
        {
          outcome: "ok",
          usage: {
            promptTokens: 100,
            completionTokens: 5,
            cacheReadTokens: 40,
            cacheWriteTokens: 10,
          },
        },
      ],
    });
  });
});
