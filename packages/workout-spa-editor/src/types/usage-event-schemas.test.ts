import { describe, expect, it } from "vitest";

import { usageEventSchema } from "./usage-event-schemas";

const validRow = {
  id: "evt-1",
  yearMonth: "2026-07",
  date: "2026-07-10",
  purpose: "chat",
  providerType: "anthropic" as const,
  promptTokens: 120,
  completionTokens: 80,
  tokens: 200,
  cost: 0.0006,
  createdAt: "2026-07-10T10:00:00.000Z",
};

describe("usageEventSchema", () => {
  it("should accept a well-formed event row", () => {
    // Arrange
    const row = validRow;

    // Act
    const parsed = usageEventSchema.parse(row);

    // Assert
    expect(parsed.tokens).toBe(200);
  });

  it("should accept a row without provider type or model id", () => {
    // Arrange
    const row = {
      ...validRow,
      providerType: undefined,
      modelId: undefined,
      cost: 0,
    };

    // Act
    const parsed = usageEventSchema.parse(row);

    // Assert
    expect(parsed.providerType).toBeUndefined();
  });

  it.each([
    { case: "tokens that disagree with the split sum", over: { tokens: 199 } },
    { case: "a malformed year-month key", over: { yearMonth: "2026-13" } },
    {
      case: "a payload-bearing field (redaction must hold at runtime)",
      over: { promptText: "secret user prompt" },
    },
  ])("should reject a row with $case", ({ over }) => {
    // Arrange
    const row = { ...validRow, ...over };

    // Act
    const result = usageEventSchema.safeParse(row);

    // Assert
    expect(result.success).toBe(false);
  });
});
