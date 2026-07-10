import { describe, expect, it } from "vitest";

import type { UsageEventRecord } from "../../types/usage-event-schemas";
import { foldUsageEvents } from "./fold-usage-events";

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

  it("should return zeros for an empty log", () => {
    // Arrange
    const events: UsageEventRecord[] = [];

    // Act
    const totals = foldUsageEvents(events);

    // Assert
    expect(totals).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
    });
  });
});
