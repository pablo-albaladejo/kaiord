import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { appendUsageEvent } from "./append-usage-event";

const fixedNow = () => new Date("2026-11-23T10:00:00.000Z");
let counter = 0;
const seqId = () => `evt-${(counter += 1)}`;
const DIGITS = 10;
// claude-sonnet-5: $2 input, $10 output per 1M (read 2026-11-23).
const SONNET_5_120_IN_80_OUT_USD = 0.00104;
const ok = (usage: { promptTokens: number; completionTokens: number }) => ({
  outcome: "ok" as const,
  usage,
});

describe("appendUsageEvent", () => {
  it("should price the run at the model's own input and output prices", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      {
        purpose: "chat",
        providerType: "anthropic",
        modelId: "claude-sonnet-5",
        requests: [ok({ promptTokens: 120, completionTokens: 80 })],
      },
      fixedNow,
      seqId
    );
    const [row] = await persistence.usageEvents.listByMonth("2026-11");

    // Assert

    // 120*2 + 80*10 = 1040 micro-dollars
    expect(row?.cost).toBeCloseTo(SONNET_5_120_IN_80_OUT_USD, DIGITS);
    expect(row).toMatchObject({
      costBasis: "price_table",
      priceReadOn: "2026-11-23",
      requestCount: 1,
      failedRequests: 0,
      unmeasuredRequests: 0,
    });
  });

  it("should derive yearMonth, date, and tokens from the injected clock and requests", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      {
        purpose: "workout_generation",
        providerType: "google",
        modelId: "gemini-2.5-flash",
        requests: [ok({ promptTokens: 30, completionTokens: 10 })],
      },
      fixedNow,
      seqId
    );
    const [row] = await persistence.usageEvents.listByMonth("2026-11");

    // Assert
    expect(row).toMatchObject({
      yearMonth: "2026-11",
      date: "2026-11-23",
      promptTokens: 30,
      completionTokens: 10,
      tokens: 40,
    });
  });

  it("should record the cost as unknown, not zero, when the provider type is absent", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      {
        purpose: "lab_extraction",
        modelId: "claude-sonnet-5",
        requests: [ok({ promptTokens: 100, completionTokens: 20 })],
      },
      fixedNow,
      seqId
    );
    const [row] = await persistence.usageEvents.listByMonth("2026-11");

    // Assert
    expect(row).toMatchObject({ costBasis: "unknown", tokens: 120 });
    expect(row).not.toHaveProperty("cost");
  });

  it("should keep cache read and write tokens on the row", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      {
        purpose: "chat",
        providerType: "anthropic",
        modelId: "claude-sonnet-5",
        requests: [
          {
            outcome: "ok",
            usage: {
              promptTokens: 100,
              completionTokens: 5,
              cacheReadTokens: 60,
              cacheWriteTokens: 30,
            },
          },
        ],
      },
      fixedNow,
      seqId
    );
    const [row] = await persistence.usageEvents.listByMonth("2026-11");

    // Assert
    expect(row).toMatchObject({ cacheReadTokens: 60, cacheWriteTokens: 30 });
  });

  it("should record a run whose only request reported no usage, as unmeasured", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      {
        purpose: "chat",
        providerType: "anthropic",
        modelId: "claude-sonnet-5",
        requests: [{ outcome: "error" }],
      },
      fixedNow,
      seqId
    );
    const [row] = await persistence.usageEvents.listByMonth("2026-11");

    // Assert
    expect(row).toMatchObject({
      tokens: 0,
      requestCount: 1,
      failedRequests: 1,
      unmeasuredRequests: 1,
    });
  });

  it("should skip a run that made no request", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      { purpose: "chat", modelId: "claude-sonnet-5", requests: [] },
      fixedNow,
      seqId
    );
    const rows = await persistence.usageEvents.listByMonth("2026-11");

    // Assert
    expect(rows).toHaveLength(0);
  });
});
