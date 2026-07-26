import { describe, it, expect } from "vitest";
import { z } from "zod";
import { definePrompt } from "../prompts/registry";
import { runGenerateAgent } from "./runtime";
import type { AgentDefinition } from "./definition-types";
import { createRingBufferTelemetrySink } from "../observability/ring-buffer-sink";
import {
  jsonResult,
  mockModelReturning,
} from "../test-utils/mock-language-model";
import { MockLanguageModelV4 } from "ai/test";

definePrompt({
  id: "test/telemetry",
  version: "2.0.0",
  template: "prompt body",
  variables: [],
});

const AGENT: AgentDefinition<{ n: number }> = {
  id: "telemetry-agent",
  version: "3.1.0",
  purpose: "lab_extraction",
  systemPrompt: { id: "test/telemetry" },
  mode: "generate",
  outputSchema: z.object({ n: z.number().optional() }),
  validate: (raw) => z.object({ n: z.number() }).parse(raw),
};

describe("runGenerateAgent telemetry", () => {
  it("should emit a run_finished event with identity, usage, and latency", async () => {
    // Arrange
    const telemetry = createRingBufferTelemetrySink();
    const model = mockModelReturning({ n: 5 });

    // Act
    await runGenerateAgent(AGENT, { text: "x" }, { model, telemetry });

    // Assert
    const [event] = telemetry.events();
    expect(event).toMatchObject({
      type: "run_finished",
      agentId: "telemetry-agent",
      agentVersion: "3.1.0",
      promptId: "test/telemetry",
      promptVersion: "2.0.0",
      purpose: "lab_extraction",
      usage: { promptTokens: 10, completionTokens: 5 },
    });
    expect(typeof event.latencyMs).toBe("number");
  });

  it("should emit a run_failed event when the run exhausts retries", async () => {
    // Arrange
    const telemetry = createRingBufferTelemetrySink();
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doGenerate: [jsonResult({}), jsonResult({}), jsonResult({})],
    });

    // Act
    await runGenerateAgent(AGENT, { text: "x" }, { model, telemetry }).catch(
      () => undefined
    );

    // Assert
    const [event] = telemetry.events();
    expect(event.type).toBe("run_failed");
    expect(event).toMatchObject({ error: { retriable: true } });
  });
});
