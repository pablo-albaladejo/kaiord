import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { UsageEventRecord } from "../../types/usage-event-schemas";
import { KaiordDatabase } from "./dexie-database";
import { createDexieUsageEventRepository } from "./dexie-usage-event-repository";

const dbName = () => `kaiord-usage-events-${Date.now()}-${Math.random()}`;

const event = (over: Partial<UsageEventRecord>): UsageEventRecord => ({
  id: "evt",
  yearMonth: "2026-07",
  date: "2026-07-10",
  purpose: "chat",
  providerType: "anthropic",
  promptTokens: 100,
  completionTokens: 50,
  tokens: 150,
  cost: 0.00045,
  createdAt: "2026-07-10T10:00:00.000Z",
  ...over,
});

describe("createDexieUsageEventRepository", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(async () => {
    name = dbName();
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should append an event and read it back by month", async () => {
    // Arrange
    const repo = createDexieUsageEventRepository(db);

    // Act
    await repo.append(event({ id: "e1" }));
    const rows = await repo.listByMonth("2026-07");

    // Assert
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("e1");
  });

  it("should list every purpose within the requested month", async () => {
    // Arrange
    const repo = createDexieUsageEventRepository(db);
    await repo.append(event({ id: "e1", purpose: "chat" }));
    await repo.append(event({ id: "e2", purpose: "lab_extraction" }));

    // Act
    const rows = await repo.listByMonth("2026-07");

    // Assert
    expect(rows.map((r) => r.purpose).sort()).toEqual([
      "chat",
      "lab_extraction",
    ]);
  });

  it("should exclude events from other months", async () => {
    // Arrange
    const repo = createDexieUsageEventRepository(db);
    await repo.append(event({ id: "e1", yearMonth: "2026-07" }));
    await repo.append(event({ id: "e2", yearMonth: "2026-06" }));

    // Act
    const rows = await repo.listByMonth("2026-07");

    // Assert
    expect(rows.map((r) => r.id)).toEqual(["e1"]);
  });
});
