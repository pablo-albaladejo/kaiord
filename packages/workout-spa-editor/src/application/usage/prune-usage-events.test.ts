import { describe, expect, it } from "vitest";

import { withTombstones } from "../../adapters/with-tombstones";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { UsageEventRecord } from "../../types/usage-event-schemas";
import { pruneUsageEvents } from "./prune-usage-events";

const NOW = new Date("2026-07-15T00:00:00.000Z");
const OLD_MONTH = "2025-06";
const RECENT_MONTH = "2026-07";
const PROMPT_TOKENS = 10;
const COMPLETION_TOKENS = 5;

const makeEvent = (over: Partial<UsageEventRecord>): UsageEventRecord => ({
  id: "e",
  yearMonth: RECENT_MONTH,
  date: `${RECENT_MONTH}-01`,
  purpose: "chat",
  promptTokens: PROMPT_TOKENS,
  completionTokens: COMPLETION_TOKENS,
  tokens: PROMPT_TOKENS + COMPLETION_TOKENS,
  cost: 0,
  createdAt: `${RECENT_MONTH}-01T00:00:00.000Z`,
  ...over,
});

describe("pruneUsageEvents", () => {
  it("should delete and tombstone events older than the retention window", async () => {
    // Arrange
    const persistence = withTombstones(createInMemoryPersistence());
    await persistence.usageEvents.append(
      makeEvent({ id: "old", yearMonth: OLD_MONTH, date: `${OLD_MONTH}-01` })
    );
    await persistence.usageEvents.append(makeEvent({ id: "recent" }));

    // Act
    await pruneUsageEvents(persistence, { now: () => NOW });

    // Assert
    expect(await persistence.usageEvents.getById("old")).toBeUndefined();
    expect(await persistence.usageEvents.getById("recent")).toBeDefined();
    expect(
      await persistence.tombstones.get("usageEvents", "old")
    ).toBeDefined();
  });

  it("should keep events within the retention window untouched", async () => {
    // Arrange
    const persistence = withTombstones(createInMemoryPersistence());
    await persistence.usageEvents.append(makeEvent({ id: "recent" }));

    // Act
    await pruneUsageEvents(persistence, { now: () => NOW });

    // Assert
    expect(await persistence.usageEvents.getById("recent")).toBeDefined();
    expect(await persistence.tombstones.list()).toHaveLength(0);
  });

  it("should be a no-op for an empty log", async () => {
    // Arrange
    const persistence = withTombstones(createInMemoryPersistence());

    // Act
    const act = pruneUsageEvents(persistence, { now: () => NOW });

    // Assert
    await expect(act).resolves.toBeUndefined();
    expect(await persistence.tombstones.list()).toHaveLength(0);
  });
});
