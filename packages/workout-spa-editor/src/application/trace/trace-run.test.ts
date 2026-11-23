import type { AiTelemetryEvent } from "@kaiord/ai/observability";
import { describe, expect, it, vi } from "vitest";

import { createInMemoryTraceRepository } from "../../test-utils/in-memory-trace-repository";
import { startTraceRun } from "./trace-run";

const TICK_MS = 1500;
const BATCH_REQUESTS = 3;

const clock = () => {
  let ms = Date.parse("2026-11-20T10:00:00.000Z");
  return () => {
    const at = new Date(ms);
    ms += TICK_MS;
    return at;
  };
};

const generation = (
  over: Partial<Extract<AiTelemetryEvent, { type: "run_finished" }>> = {}
): AiTelemetryEvent => ({
  type: "run_finished",
  traceId: "agent-trace",
  agentId: "workout-parser",
  agentVersion: "3",
  promptId: "parse-workout",
  promptVersion: "7",
  provider: "anthropic.messages",
  modelId: "claude-fable-5",
  purpose: "generation",
  latencyMs: 900,
  timings: { attempts: 2, phaseMs: {}, retryReasons: ["invalid"] },
  requests: [
    { outcome: "invalid", usage: { promptTokens: 500, completionTokens: 100 } },
    { outcome: "ok", usage: { promptTokens: 500, completionTokens: 100 } },
  ],
  ...over,
});

const chatTurn = (status: "complete" | "pending_action"): AiTelemetryEvent => ({
  type: "chat_turn_finished",
  traceId: `turn-${status}`,
  promptVersion: "chat-4",
  provider: "anthropic.messages",
  modelId: "claude-fable-5",
  steps: 1,
  toolNames: ["create_workout"],
  status,
  inputTokens: 100,
  outputTokens: 10,
  latencyMs: 400,
  requests: [
    { outcome: "ok", usage: { promptTokens: 100, completionTokens: 10 } },
  ],
});

const start = (feature: "chat" | "generation" | "batch" = "generation") => {
  const traces = createInMemoryTraceRepository();
  const run = startTraceRun({
    feature,
    traces,
    now: clock(),
    newId: () => "trace-1",
  });
  return { traces, run };
};

describe("startTraceRun", () => {
  it("should store one Trace with the cost, the unit, the retries and what was sent", async () => {
    // Arrange
    const { traces, run } = start();
    run.sink().emit(generation());
    run.sent("anthropic", ["workoutDescription", "heartRateZones"]);

    // Act
    await run.finish();
    const stored = await traces.list();

    // Assert
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: "trace-1",
      feature: "generation",
      startedAt: "2026-11-20T10:00:00.000Z",
      finishedAt: "2026-11-20T10:00:01.500Z",
      latencyMs: 1500,
      outcome: "ok",
      modelCalls: 2,
      retries: 1,
      units: [
        {
          agentId: "workout-parser",
          agentVersion: "3",
          promptId: "parse-workout",
          promptVersion: "7",
        },
      ],
      totalUsd: 0.02,
      sent: [
        { to: "anthropic", kinds: ["workoutDescription", "heartRateZones"] },
      ],
    });
    expect(stored[0]?.cost).toHaveLength(1);
    expect(stored[0]?.cost[0]).toMatchObject({
      provider: "anthropic",
      modelId: "claude-fable-5",
      failedRequests: 1,
      usage: { promptTokens: 1000, completionTokens: 200 },
    });
  });

  it("should write one Trace however many times the run is finished", async () => {
    // Arrange
    const { traces, run } = start();

    // Act
    await run.finish();
    await run.finish("failed");

    // Assert
    expect(await traces.list()).toHaveLength(1);
  });

  it("should gather every generation of a batch into one Trace", async () => {
    // Arrange
    const { traces, run } = start("batch");
    const sink = run.sink();

    // Act
    sink.emit(generation());
    sink.emit(
      generation({ timings: undefined, requests: [{ outcome: "ok" }] })
    );
    await run.finish();
    const [trace] = await traces.list();

    // Assert
    expect(trace?.modelCalls).toBe(BATCH_REQUESTS);
    expect(trace?.retries).toBe(1);
    expect(trace?.cost[0]?.unmeasuredRequests).toBe(1);
  });

  it("should pass each event on as it came, never under the Trace's id", () => {
    // Arrange
    const { run } = start();
    const forward = { emit: vi.fn() };
    const event = generation();

    // Act
    run.sink(forward).emit(event);

    // Assert
    expect(forward.emit).toHaveBeenCalledWith(event);
    expect(JSON.stringify(forward.emit.mock.calls)).not.toContain("trace-1");
  });

  it("should record each Tool with its confirmation and result, and the chat unit once", async () => {
    // Arrange
    const { traces, run } = start("chat");
    run.sink().emit(chatTurn("pending_action"));
    run.tool({ name: "create_workout", confirmation: "athlete", result: "ok" });
    run.sink().emit(chatTurn("complete"));

    // Act
    await run.finish();
    const [trace] = await traces.list();

    // Assert
    expect(trace?.units).toEqual([{ promptVersion: "chat-4" }]);
    expect(trace?.tools).toEqual([
      { name: "create_workout", confirmation: "athlete", result: "ok" },
    ]);
    expect(trace?.retries).toBe(0);
  });

  it("should say a run failed when one of its model calls failed", async () => {
    // Arrange
    const { traces, run } = start();
    run.sink().emit({
      ...generation(),
      type: "run_failed",
      error: { name: "AiAgentError", retriable: true },
    } as AiTelemetryEvent);

    // Act
    await run.finish();
    const [trace] = await traces.list();

    // Assert
    expect(trace?.outcome).toBe("failed");
  });

  it("should leave the cost unknown when the model has no price", async () => {
    // Arrange
    const { traces, run } = start();
    run.sink().emit(generation({ modelId: "a-model-with-no-price" }));

    // Act
    await run.finish();
    const [trace] = await traces.list();

    // Assert
    expect(trace?.totalUsd).toBeNull();
    expect(trace?.cost[0]?.basis.kind).toBe("unknown");
  });
});
