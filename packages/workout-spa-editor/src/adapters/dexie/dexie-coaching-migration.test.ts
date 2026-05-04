/**
 * Dexie v3 → v4 migration tests for the coaching integration:
 *  - Backfills `linkedAccounts: []` on existing profiles.
 *  - Adds `coachingActivities` and `coachingSyncState` tables.
 *  - Leaves the bridge-discovery `syncState` table byte-identically unchanged.
 */

import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const seedV3 = async (dbName: string) => {
  const v3 = new Dexie(dbName);
  v3.version(3).stores({
    workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
    templates: "id, sport, *tags",
    profiles: "id",
    aiProviders: "id",
    syncState: "source",
    usage: "yearMonth",
    meta: "key",
    bridges: "extensionId, status, lastSeen",
  });
  await v3.open();
  await v3.table("profiles").put({
    id: "00000000-0000-0000-0000-000000000001",
    name: "Pablo",
    sportZones: {},
    createdAt: "2026-04-01T10:00:00.000Z",
    updatedAt: "2026-04-01T10:00:00.000Z",
    // Note: NO linkedAccounts field
  });
  await v3.table("syncState").put({
    source: "garmin-bridge",
    extensionId: "ext-1",
    lastSeen: "2026-04-01T10:00:00.000Z",
    capabilities: ["write:workouts"],
    protocolVersion: 1,
  });
  v3.close();
};

describe("Dexie v3 → v4 upgrade (coaching integration)", () => {
  it("should backfill linkedAccounts: [] on existing profile rows", async () => {
    // Arrange
    const dbName = `kaiord-coaching-migration-${Date.now()}-${Math.random()}`;
    await seedV3(dbName);
    const v4 = new KaiordDatabase(dbName);
    await v4.open();
    const profile = await v4
      .table<{ id: string; linkedAccounts: unknown[] }>("profiles")
      .get("00000000-0000-0000-0000-000000000001");
    expect(profile?.linkedAccounts).toEqual([]);

    // Act
    v4.close();

    // Assert
  });

  it("should create an empty coachingActivities table", async () => {
    // Arrange
    const dbName = `kaiord-coaching-migration-${Date.now()}-${Math.random()}`;
    await seedV3(dbName);
    const v4 = new KaiordDatabase(dbName);
    await v4.open();
    const count = await v4.table("coachingActivities").count();
    expect(count).toBe(0);

    // Act
    v4.close();

    // Assert
  });

  it("should create an empty coachingSyncState table", async () => {
    // Arrange
    const dbName = `kaiord-coaching-migration-${Date.now()}-${Math.random()}`;
    await seedV3(dbName);
    const v4 = new KaiordDatabase(dbName);
    await v4.open();
    const count = await v4.table("coachingSyncState").count();
    expect(count).toBe(0);

    // Act
    v4.close();

    // Assert
  });

  it("should leave bridge-discovery syncState rows byte-identically unchanged", async () => {
    // Arrange
    const dbName = `kaiord-coaching-migration-${Date.now()}-${Math.random()}`;
    await seedV3(dbName);
    const v4 = new KaiordDatabase(dbName);
    await v4.open();
    const row = await v4.table("syncState").get("garmin-bridge");
    expect(row).toEqual({
      source: "garmin-bridge",
      extensionId: "ext-1",
      lastSeen: "2026-04-01T10:00:00.000Z",
      capabilities: ["write:workouts"],
      protocolVersion: 1,
    });

    // Act
    v4.close();

    // Assert
  });

  it("should have syncState store schema string equal 'source' byte-identically (no compound index added)", async () => {
    // Arrange
    const dbName = `kaiord-coaching-migration-${Date.now()}-${Math.random()}`;
    await seedV3(dbName);
    const v4 = new KaiordDatabase(dbName);
    await v4.open();
    const schema = v4.table("syncState").schema;
    expect(schema.primKey.keyPath).toBe("source");
    expect(schema.indexes.map((i) => i.name)).toEqual([]);

    // Act
    v4.close();

    // Assert
  });

  it("should have coachingSyncState store schema string equal '[source+profileId], source, profileId' byte-identically", async () => {
    // Arrange
    const dbName = `kaiord-coaching-migration-${Date.now()}-${Math.random()}`;
    await seedV3(dbName);
    const v4 = new KaiordDatabase(dbName);
    await v4.open();
    const schema = v4.table("coachingSyncState").schema;
    expect(schema.primKey.keyPath).toEqual(["source", "profileId"]);
    const indexNames = schema.indexes.map((i) => i.name).sort();
    expect(indexNames).toEqual(["profileId", "source"]);

    // Act
    v4.close();

    // Assert
  });

  it("should keep a v4-migrated profile row readable under v3 schema (forward-tolerance)", async () => {
    // Arrange
    const dbName = `kaiord-coaching-migration-${Date.now()}-${Math.random()}`;
    await seedV3(dbName);
    const v4 = new KaiordDatabase(dbName);
    await v4.open();
    await v4.table("profiles").put({
      id: "00000000-0000-0000-0000-000000000002",
      name: "Other",
      sportZones: {},
      linkedAccounts: [
        {
          source: "train2go",
          externalUserId: "28035",
          externalUserName: "Pablo",
          linkedAt: "2026-04-28T10:00:00.000Z",
        },
      ],
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    });
    v4.close();
    const v3Again = new Dexie(dbName);
    v3Again.version(3).stores({
      workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
      templates: "id, sport, *tags",
      profiles: "id",
      aiProviders: "id",
      syncState: "source",
      usage: "yearMonth",
      meta: "key",
      bridges: "extensionId, status, lastSeen",
    });
    await v3Again.open();
    const profile = await v3Again
      .table<{
        id: string;
        linkedAccounts?: Array<{ source: string; externalUserId: string }>;
      }>("profiles")
      .get("00000000-0000-0000-0000-000000000002");
    expect(profile?.linkedAccounts).toBeDefined();
    expect(profile?.linkedAccounts?.[0]?.externalUserId).toBe("28035");

    // Act
    v3Again.close();

    // Assert
  });
});
