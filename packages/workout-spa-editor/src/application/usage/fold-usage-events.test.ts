import { describe, expect, it } from "vitest";

import type { UsageEventRecord } from "../../types/usage-event-schemas";
import { foldUsageByModel, foldUsageEvents } from "./fold-usage-events";

const DIGITS = 10;
// claude-sonnet-5 at $2 input and $10 output per 1M: 1000*2 + 500*10.
const SONNET_5_1000_IN_500_OUT_USD = 0.007;
const PRICED_RUN_USD = 0.004;

const event = (over: Partial<UsageEventRecord>): UsageEventRecord => ({
  id: "e",
  yearMonth: "2026-07",
  date: "2026-07-10",
  purpose: "chat",
  providerType: "anthropic",
  promptTokens: 100,
  completionTokens: 50,
  tokens: 150,
  cost: 0.001,
  createdAt: "2026-07-10T10:00:00.000Z",
  ...over,
});

describe("foldUsageEvents", () => {
  it("should sum tokens and cost across events", () => {
    // Arrange
    const events = [
      event({ id: "a", promptTokens: 100, completionTokens: 50, tokens: 150 }),
      event({ id: "b", promptTokens: 200, completionTokens: 60, tokens: 260 }),
    ];

    // Act
    const totals = foldUsageEvents(events);

    // Assert
    expect(totals).toMatchObject({
      inputTokens: 300,
      outputTokens: 110,
      totalTokens: 410,
    });
  });

  it("should include only the requested purpose when filtering", () => {
    // Arrange
    const events = [
      event({ id: "a", purpose: "chat", promptTokens: 100, tokens: 150 }),
      event({
        id: "b",
        purpose: "lab_extraction",
        promptTokens: 999,
        tokens: 1049,
      }),
    ];

    // Act
    const totals = foldUsageEvents(events, { purpose: "chat" });

    // Assert
    expect(totals.inputTokens).toBe(100);
  });

  it("should sum in createdAt order regardless of input order", () => {
    // Arrange
    const late = event({
      id: "late",
      createdAt: "2026-07-10T12:00:00.000Z",
      cost: 0.002,
    });
    const early = event({
      id: "early",
      createdAt: "2026-07-10T08:00:00.000Z",
      cost: 0.001,
    });

    // Act
    const ascending = foldUsageEvents([early, late]);
    const descending = foldUsageEvents([late, early]);

    // Assert
    expect(descending).toEqual(ascending);
  });

  it("should return zeros for an empty log", () => {
    // Arrange
    const events: UsageEventRecord[] = [];

    // Act
    const totals = foldUsageEvents(events);

    // Assert
    expect(totals).toEqual({
      runs: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      unknownCostRuns: 0,
      failedRequests: 0,
      unmeasuredRequests: 0,
      estimatedRequests: 0,
    });
  });

  it("should count a run whose model has no price as unknown, adding nothing to the cost", () => {
    // Arrange
    const events = [
      event({ id: "a", costBasis: "price_table", cost: PRICED_RUN_USD }),
      event({ id: "b", costBasis: "unknown", cost: 0, modelId: "o1" }),
    ];

    // Act
    const totals = foldUsageEvents(events);

    // Assert
    expect(totals.totalCost).toBeCloseTo(PRICED_RUN_USD, DIGITS);
    expect(totals.unknownCostRuns).toBe(1);
  });

  it("should price a row written at the old blended rate again at its model's own prices", () => {
    // Arrange
    // Written before per-model pricing, with no costBasis
    const legacy = event({
      providerType: "anthropic",
      modelId: "claude-sonnet-5",
      promptTokens: 1000,
      completionTokens: 500,
      tokens: 1500,
      cost: 0.0045,
      createdAt: "2026-11-01T10:00:00.000Z",
    });

    // Act
    const totals = foldUsageEvents([legacy]);

    // Assert
    expect(totals.totalCost).toBeCloseTo(SONNET_5_1000_IN_500_OUT_USD, DIGITS);
  });

  it("should sum the failed and unmeasured requests of every run", () => {
    // Arrange
    const events = [
      event({ id: "a", costBasis: "price_table", failedRequests: 2 }),
      event({
        id: "b",
        costBasis: "price_table",
        failedRequests: 1,
        unmeasuredRequests: 1,
      }),
    ];

    // Act
    const totals = foldUsageEvents(events);

    // Assert
    expect(totals).toMatchObject({ failedRequests: 3, unmeasuredRequests: 1 });
  });
});

describe("foldUsageByModel", () => {
  it("should give each model its own runs, tokens and cost, most expensive first", () => {
    // Arrange
    const events = [
      event({ id: "a", modelId: "claude-haiku-4-5", cost: 0.001 }),
      event({ id: "b", modelId: "claude-sonnet-5", cost: 0.003 }),
      event({ id: "c", modelId: "claude-sonnet-5", cost: 0.002 }),
    ].map((e) => ({ ...e, costBasis: "price_table" as const }));

    // Act
    const models = foldUsageByModel(events);

    // Assert
    expect(
      models.map((m) => ({
        modelId: m.modelId,
        runs: m.totals.runs,
        tokens: m.totals.totalTokens,
      }))
    ).toEqual([
      { modelId: "claude-sonnet-5", runs: 2, tokens: 300 },
      { modelId: "claude-haiku-4-5", runs: 1, tokens: 150 },
    ]);
  });
});
