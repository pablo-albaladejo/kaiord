import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { estimateCost } from "../cost-estimation";
import { getProviderRate } from "../provider-rates";
import { appendUsageEvent } from "./append-usage-event";

const fixedNow = () => new Date("2026-07-10T10:00:00.000Z");
let counter = 0;
const seqId = () => `evt-${(counter += 1)}`;

describe("appendUsageEvent", () => {
  it("should append one event with the legacy cost formula", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      {
        purpose: "chat",
        providerType: "anthropic",
        promptTokens: 120,
        completionTokens: 80,
      },
      fixedNow,
      seqId
    );
    const rows = await persistence.usageEvents.listByMonth("2026-07");

    // Assert
    expect(rows).toHaveLength(1);
    expect(rows[0]?.cost).toBe(estimateCost(200, getProviderRate("anthropic")));
  });

  it("should derive yearMonth, date, and tokens from the injected clock", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      {
        purpose: "workout_generation",
        providerType: "google",
        promptTokens: 30,
        completionTokens: 10,
      },
      fixedNow,
      seqId
    );
    const [row] = await persistence.usageEvents.listByMonth("2026-07");

    // Assert
    expect(row).toMatchObject({
      yearMonth: "2026-07",
      date: "2026-07-10",
      tokens: 40,
    });
  });

  it("should record zero cost when the provider type is absent", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      { purpose: "lab_extraction", promptTokens: 100, completionTokens: 20 },
      fixedNow,
      seqId
    );
    const [row] = await persistence.usageEvents.listByMonth("2026-07");

    // Assert
    expect(row?.cost).toBe(0);
  });

  it("should skip a zero-token run", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await appendUsageEvent(
      persistence,
      { purpose: "chat", promptTokens: 0, completionTokens: 0 },
      fixedNow,
      seqId
    );
    const rows = await persistence.usageEvents.listByMonth("2026-07");

    // Assert
    expect(rows).toHaveLength(0);
  });
});
