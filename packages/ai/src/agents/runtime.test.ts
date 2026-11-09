import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { definePrompt } from "../prompts/registry";
import { runGenerateAgent } from "./runtime";
import { AiAgentError } from "./errors";
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

  it("should return the output when the telemetry sink throws on a finished run", async () => {
    // Arrange
    const sink = {
      emit: () => {
        throw new Error("sink down");
      },
    };
    const model = mockModelReturning({ n: 5 });

    // Act
    const result = await runGenerateAgent(
      AGENT,
      { text: "x" },
      { model, telemetry: sink }
    );

    // Assert
    expect(result.output).toEqual({ n: 5 });
  });

  it("should rethrow the run error, not the sink error, when the sink throws on a failed run", async () => {
    // Arrange
    const types: string[] = [];
    const sink = {
      emit: (e: { type: string }) => {
        types.push(e.type);
        throw new Error("sink down");
      },
    };
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doGenerate: [jsonResult({}), jsonResult({}), jsonResult({})],
    });

    // Act
    const error = await runGenerateAgent(
      AGENT,
      { text: "x" },
      { model, telemetry: sink }
    ).catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(AiAgentError);
    expect((error as Error).message).toMatch(/Failed after 3 attempts/);
    expect(types).toEqual(["run_failed"]);
  });

  it("should warn through the logger when the sink throws", async () => {
    // Arrange
    const warn = vi.fn();
    const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() };
    const sink = {
      emit: () => {
        throw new Error("sink down");
      },
    };

    // Act
    await runGenerateAgent(
      AGENT,
      { text: "x" },
      { model: mockModelReturning({ n: 5 }), telemetry: sink, logger }
    );

    // Assert
    expect(warn).toHaveBeenCalledWith(
      "Telemetry sink failed",
      expect.objectContaining({ type: "run_finished" })
    );
  });

  it("should emit exactly one run_finished event and no run_failed when the sink throws once", async () => {
    // Arrange
    const events: string[] = [];
    const sink = {
      emit: (e: { type: string }) => {
        events.push(e.type);
        throw new Error("sink down");
      },
    };
    const model = mockModelReturning({ n: 5 });

    // Act
    await runGenerateAgent(AGENT, { text: "x" }, { model, telemetry: sink });

    // Assert
    expect(events).toEqual(["run_finished"]);
  });
});
