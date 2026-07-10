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

  it("should reject a row whose tokens do not equal the split sum", () => {
    // Arrange
    const row = { ...validRow, tokens: 199 };

    // Act
    const result = usageEventSchema.safeParse(row);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a malformed year-month key", () => {
    // Arrange
    const row = { ...validRow, yearMonth: "2026-13" };

    // Act
    const result = usageEventSchema.safeParse(row);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a payload-bearing row so redaction holds at runtime", () => {
    // Arrange
    const row = { ...validRow, promptText: "secret user prompt" };

    // Act
    const result = usageEventSchema.safeParse(row);

    // Assert
    expect(result.success).toBe(false);
  });
});
