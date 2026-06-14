import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { recordChatUsage } from "./record-chat-usage";

const NOW = () => new Date("2026-06-13T10:00:00.000Z");
const COMBINED_TOTAL_TOKENS = 155; // 100+40 then 10+5

describe("recordChatUsage", () => {
  it("should create a monthly row and accumulate tokens", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await recordChatUsage(
      persistence,
      { providerType: "anthropic", promptTokens: 100, completionTokens: 40 },
      NOW
    );

    // Assert
    const row = await persistence.usage.getByMonth("2026-06");
    expect(row).toMatchObject({
      yearMonth: "2026-06",
      inputTokens: 100,
      outputTokens: 40,
      totalTokens: 140,
    });
    expect(row?.entries).toHaveLength(1);
  });

  it("should add to an existing month rather than overwrite", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await recordChatUsage(
      persistence,
      { providerType: "anthropic", promptTokens: 100, completionTokens: 40 },
      NOW
    );

    // Act
    await recordChatUsage(
      persistence,
      { providerType: "anthropic", promptTokens: 10, completionTokens: 5 },
      NOW
    );

    // Assert
    const row = await persistence.usage.getByMonth("2026-06");
    expect(row?.totalTokens).toBe(COMBINED_TOTAL_TOKENS);
    expect(row?.entries).toHaveLength(2);
  });

  it("should be a no-op when the turn reported zero tokens", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await recordChatUsage(
      persistence,
      { providerType: "openai", promptTokens: 0, completionTokens: 0 },
      NOW
    );

    // Assert
    expect(await persistence.usage.getByMonth("2026-06")).toBeUndefined();
  });
});
