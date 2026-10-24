import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { definePrompt } from "../prompts/registry";
import { createRingBufferTelemetrySink } from "../observability/ring-buffer-sink";
import { jsonResult, jsonStream } from "../test-utils/mock-language-model";
import type { AgentDefinition } from "./definition-types";
import type { GenerateProgress } from "./progress";
import { runGenerateAgent } from "./runtime";

definePrompt({
  id: "test/narration",
  version: "1.0.0",
  template: "SYSTEM",
  variables: [],
});

const AGENT: AgentDefinition<{ steps: number[] }> = {
  id: "narration-agent",
  version: "1.0.0",
  purpose: "default",
  systemPrompt: { id: "test/narration" },
  mode: "generate",
  outputSchema: z.object({ steps: z.array(z.number()) }),
  countItems: (partial) => (partial as { steps?: unknown[] }).steps?.length,
};

const BUDGET = 1000;

const recorder = () => {
  const events: GenerateProgress[] = [];
  return { events, onProgress: (p: GenerateProgress) => events.push(p) };
};

describe("runGenerateAgent narration", () => {
  it("should report reasoning between requesting and the first output", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [
        jsonStream(['{"steps":[1,', "2]}"], { reasoning: ["Let me", " see"] }),
      ],
    });
    const { events, onProgress } = recorder();

    // Act
    await runGenerateAgent(AGENT, { text: "go" }, { model, onProgress });

    // Assert
    expect(events.map((e) => e.phase)).toEqual([
      "requesting",
      "reasoning",
      "generating",
      "generating",
      "validating",
    ]);
  });

  it("should carry the partial output on each generating update", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [jsonStream(['{"steps":[1,', "2]}"])],
    });
    const { events, onProgress } = recorder();

    // Act
    await runGenerateAgent(AGENT, { text: "go" }, { model, onProgress });

    // Assert
    const generating = events.filter((e) => e.phase === "generating");
    expect(generating.at(-1)?.partial).toEqual({ steps: [1, 2] });
  });

  it("should retry a truncated output and say it was truncated", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [
        jsonStream(['{"steps":[1,2'], { finishReason: "length" }),
        jsonStream(['{"steps":[1]}']),
      ],
    });
    const { events, onProgress } = recorder();

    // Act
    const result = await runGenerateAgent(
      AGENT,
      { text: "go" },
      { model, onProgress }
    );

    // Assert
    expect(result.output.steps).toEqual([1]);
    const retry = events.filter((e) => e.attempt === 2);
    expect(retry.every((e) => e.retryReason === "truncated")).toBe(true);
    expect(events.filter((e) => e.attempt === 1).map((e) => e.phase)).toEqual([
      "requesting",
      "generating",
    ]);
    expect(JSON.stringify(model.doStreamCalls[1]?.prompt)).toContain(
      "cut off at the token limit"
    );
  });

  it("should treat a one-shot output cut at the token limit as truncated", async () => {
    // Arrange
    const cut = {
      ...(jsonResult({ steps: [1] }) as object),
      content: [{ type: "text", text: '{"steps":[1,' }],
      finishReason: { unified: "length", raw: "max_tokens" },
    };
    const model = new MockLanguageModelV4({
      doGenerate: [cut as never, jsonResult({ steps: [2] })],
    });

    // Act
    const result = await runGenerateAgent(AGENT, { text: "go" }, { model });

    // Assert
    expect(result.output.steps).toEqual([2]);
    expect(JSON.stringify(model.doGenerateCalls[1]?.prompt)).toContain(
      "cut off at the token limit"
    );
  });

  it("should put the run's timings on its telemetry event", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [
        jsonStream(['{"steps":[1,2'], { finishReason: "length" }),
        jsonStream(['{"steps":[1]}'], { reasoning: ["hm"] }),
      ],
    });
    const telemetry = createRingBufferTelemetrySink();

    // Act
    await runGenerateAgent(
      AGENT,
      { text: "go" },
      { model, telemetry, onProgress: () => {} }
    );

    // Assert
    const [event] = telemetry.events();
    expect(event?.type).toBe("run_finished");
    const timings = event?.type === "run_finished" ? event.timings : undefined;
    expect(timings?.attempts).toBe(2);
    expect(timings?.retryReasons).toEqual(["truncated"]);
    expect(Object.keys(timings?.phaseMs ?? {}).sort()).toEqual([
      "generating",
      "reasoning",
      "requesting",
      "validating",
    ]);
  });

  it("should double the output budget after each truncation", async () => {
    // Arrange
    const cut = () => jsonStream(['{"steps":[1,2'], { finishReason: "length" });
    const model = new MockLanguageModelV4({
      doStream: [cut(), cut(), jsonStream(['{"steps":[1]}'])],
    });

    // Act
    await runGenerateAgent(
      { ...AGENT, maxOutputTokens: BUDGET },
      { text: "go" },
      { model, onProgress: () => {} }
    );

    // Assert
    expect(model.doStreamCalls.map((c) => c.maxOutputTokens)).toEqual([
      BUDGET,
      BUDGET * 2,
      BUDGET * 2 * 2,
    ]);
  });

  it("should call a failure without an invalid output a provider failure", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [
        async () => {
          throw new TypeError("fetch failed");
        },
        jsonStream(['{"steps":[1]}']),
      ] as never,
    });
    const { events, onProgress } = recorder();

    // Act
    await runGenerateAgent(AGENT, { text: "go" }, { model, onProgress });

    // Assert
    expect(events.find((e) => e.attempt === 2)?.retryReason).toBe("provider");
  });
});
