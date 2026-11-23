import type {
  AiRequest,
  AiTelemetryEvent,
  ChatTurnFinishedEvent,
} from "@kaiord/ai/observability";
import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { createDexieUsageTelemetrySink } from "./dexie-usage-telemetry-sink";

const YEAR_MONTH_LENGTH = 7;
const DIGITS = 10;
// claude-sonnet-5 at $2 input and $10 output per 1M: 300*2 + 120*10.
const SONNET_5_ATTEMPT_USD = 0.0018;
const ATTEMPT = {
  outcome: "ok" as const,
  usage: { promptTokens: 300, completionTokens: 120 },
};
const INVALID = { ...ATTEMPT, outcome: "invalid" as const };
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const currentMonth = () => new Date().toISOString().slice(0, YEAR_MONTH_LENGTH);

const identity = {
  traceId: "t-1",
  agentId: "lab-extractor",
  agentVersion: "1.0.0",
  promptId: "lab-extractor/system",
  promptVersion: "1.0.0",
  provider: "anthropic.messages",
  modelId: "claude-sonnet-5",
  purpose: "lab_extraction",
  latencyMs: 42,
};

const finished = (over: Partial<AiTelemetryEvent> = {}): AiTelemetryEvent => ({
  type: "run_finished",
  ...identity,
  usage: { promptTokens: 300, completionTokens: 120 },
  requests: [ATTEMPT],
  ...over,
});

const failedRun = (requests: AiRequest[]): AiTelemetryEvent => ({
  type: "run_failed",
  ...identity,
  error: { name: "AiAgentError", retriable: true },
  requests,
});

const chatTurn = (
  over: Partial<ChatTurnFinishedEvent> = {}
): ChatTurnFinishedEvent => ({
  type: "chat_turn_finished",
  traceId: "chat-1",
  promptVersion: "1.0.0",
  provider: "anthropic.messages",
  modelId: "claude-sonnet-5",
  steps: 2,
  toolNames: ["query_workouts"],
  status: "complete",
  inputTokens: 500,
  outputTokens: 80,
  latencyMs: 900,
  requests: [
    { outcome: "ok", usage: { promptTokens: 200, completionTokens: 30 } },
    { outcome: "ok", usage: { promptTokens: 300, completionTokens: 50 } },
  ],
  ...over,
});

const fakeLogger = () => ({ warn: vi.fn() }) as unknown as Logger;

const rowsAfter = async (...events: AiTelemetryEvent[]) => {
  const persistence = createInMemoryPersistence();
  const sink = createDexieUsageTelemetrySink(persistence, fakeLogger());
  for (const event of events) sink.emit(event);
  await flush();
  return persistence.usageEvents.listByMonth(currentMonth());
};

describe("createDexieUsageTelemetrySink", () => {
  it("should append an event for a finished run, priced at its model's prices", async () => {
    // Arrange
    const run = finished();

    // Act
    const [row] = await rowsAfter(run);

    // Assert
    expect(row).toMatchObject({
      purpose: "lab_extraction",
      providerType: "anthropic",
      modelId: "claude-sonnet-5",
      tokens: 420,
      costBasis: "price_table",
    });
    expect(row!.cost).toBeCloseTo(SONNET_5_ATTEMPT_USD, DIGITS);
  });

  it("should record a failed run with the usage of every billed attempt", async () => {
    // Arrange
    const run = failedRun([INVALID, INVALID, INVALID]);

    // Act
    const [row] = await rowsAfter(run);

    // Assert
    expect(row).toMatchObject({
      purpose: "lab_extraction",
      tokens: 1260,
      requestCount: 3,
      failedRequests: 3,
    });
  });

  it("should make a run with a failed attempt cost more than the same run without it", async () => {
    // Arrange
    const clean = finished({ traceId: "clean", requests: [ATTEMPT] });
    const retried = finished({
      traceId: "retried",
      requests: [INVALID, ATTEMPT],
    });

    // Act
    const rows = await rowsAfter(clean, retried);
    const cost = (id: string) => rows.find((r) => r.traceId === id)!.cost;

    // Assert
    expect(cost("clean")).toBeCloseTo(SONNET_5_ATTEMPT_USD, DIGITS);
    expect(cost("retried")).toBeCloseTo(2 * SONNET_5_ATTEMPT_USD, DIGITS);
    expect(cost("retried")).toBeGreaterThan(cost("clean"));
  });

  it("should record a failed attempt with no usage as unmeasured, not as zero", async () => {
    // Arrange
    const run = finished({ requests: [{ outcome: "error" }, ATTEMPT] });

    // Act
    const [row] = await rowsAfter(run);

    // Assert
    expect(row).toMatchObject({ unmeasuredRequests: 1, tokens: 420 });
  });

  it("should record the cost as unknown for a model with no price", async () => {
    // Arrange
    const run = finished({ provider: "openai.responses", modelId: "o1" });

    // Act
    const [row] = await rowsAfter(run);

    // Assert
    expect(row).toMatchObject({ costBasis: "unknown", tokens: 420 });
  });

  it("should record usage with an unknown cost when the provider is unmapped", async () => {
    // Arrange
    const run = finished({ provider: "mystery.model" });

    // Act
    const [row] = await rowsAfter(run);

    // Assert
    expect(row).toMatchObject({ costBasis: "unknown", tokens: 420 });
  });

  it("should not append anything for a run that made no request", async () => {
    // Arrange
    const run = finished({ usage: undefined, requests: [] });

    // Act
    const rows = await rowsAfter(run);

    // Assert
    expect(rows).toHaveLength(0);
  });

  it("should swallow a persistence rejection instead of throwing out of emit", async () => {
    // Arrange
    const logger = fakeLogger();
    const persistence = {
      usageEvents: {
        append: () => Promise.reject(new Error("boom")),
        listByMonth: async () => [],
      },
    } as unknown as PersistencePort;
    const sink = createDexieUsageTelemetrySink(persistence, logger);

    // Act
    let threw = false;
    try {
      sink.emit(finished());
    } catch {
      threw = true;
    }
    await flush();

    // Assert
    expect(threw).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should append a chat usage row for a chat turn, stopped turns included", async () => {
    // Arrange
    const turn = chatTurn({ status: "aborted" });

    // Act
    const [row] = await rowsAfter(turn);

    // Assert
    expect(row).toMatchObject({
      purpose: "chat",
      providerType: "anthropic",
      modelId: "claude-sonnet-5",
      traceId: "chat-1",
      promptTokens: 500,
      completionTokens: 80,
      tokens: 580,
      requestCount: 2,
    });
  });

  it("should skip a chat turn that made no request", async () => {
    // Arrange
    const turn = chatTurn({
      status: "error",
      inputTokens: 0,
      outputTokens: 0,
      requests: [],
    });

    // Act
    const rows = await rowsAfter(turn);

    // Assert
    expect(rows).toHaveLength(0);
  });
});
