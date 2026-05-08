/**
 * Forward migration v5 → v6 — bridge snapshot-state backfill.
 *
 * Existing bridge rows MUST gain `pendingClear: false` and
 * `lastSuccessfulFingerprint: null` defaults so the snapshot pusher's
 * de-dup and right-to-be-forgotten paths can rely on well-defined
 * state. All other rows MUST round-trip byte-identically.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { backfillBridgeSnapshotState, KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) => `kaiord-test-v6-${suffix}-${Date.now()}`;

const DEXIE_V5 = 5;

const seedV5 = async (name: string): Promise<void> => {
  const v5 = new Dexie(name);
  v5.version(1).stores({ bridges: "extensionId, status, lastSeen" });
  v5.version(DEXIE_V5).stores({ bridges: "extensionId, status, lastSeen" });
  await v5.open();
  await v5.table("bridges").bulkPut([
    {
      extensionId: "ext-legacy-verified",
      id: "garmin-bridge",
      name: "Garmin",
      version: "7.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "verified",
      lastSeen: "2026-04-30T00:00:00.000Z",
      failCount: 0,
    },
    {
      extensionId: "ext-legacy-unavailable",
      id: "train2go-bridge",
      name: "Train2Go",
      version: "7.0.0",
      protocolVersion: 1,
      capabilities: ["read:training-plan"],
      status: "unavailable",
      lastSeen: "2026-04-29T12:00:00.000Z",
      failCount: 3,
    },
  ]);
  v5.close();
};

describe("Dexie v5 → v6 migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("backfill");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should backfill pendingClear=false and lastSuccessfulFingerprint=null on existing bridges", async () => {
    // Arrange
    await seedV5(name);
    const v6 = new KaiordDatabase(name);
    await v6.open();
    const rows = await v6.table("bridges").toArray();

    // Act
    v6.close();

    // Assert
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.pendingClear).toBe(false);
      expect(row.lastSuccessfulFingerprint).toBeNull();
    }
  });

  it("should preserve existing fields verbatim", async () => {
    // Arrange
    await seedV5(name);
    const v6 = new KaiordDatabase(name);
    await v6.open();
    const verified = await v6.table("bridges").get("ext-legacy-verified");

    // Act
    v6.close();

    // Assert
    expect(verified).toMatchObject({
      extensionId: "ext-legacy-verified",
      id: "garmin-bridge",
      name: "Garmin",
      version: "7.0.0",
      protocolVersion: 1,
      capabilities: ["write:workouts"],
      status: "verified",
      lastSeen: "2026-04-30T00:00:00.000Z",
      failCount: 0,
    });
  });
});

describe("backfillBridgeSnapshotState", () => {
  it("should set defaults on a row missing both fields", () => {
    // Arrange
    const row: Record<string, unknown> = { extensionId: "ext-1" };

    // Act
    backfillBridgeSnapshotState(row);

    // Assert
    expect(row.pendingClear).toBe(false);
    expect(row.lastSuccessfulFingerprint).toBeNull();
  });

  it("should preserve an existing pendingClear=true value", () => {
    // Arrange
    const row: Record<string, unknown> = {
      extensionId: "ext-1",
      pendingClear: true,
      lastSuccessfulFingerprint: "deadbeef",
    };

    // Act
    backfillBridgeSnapshotState(row);

    // Assert
    expect(row.pendingClear).toBe(true);
    expect(row.lastSuccessfulFingerprint).toBe("deadbeef");
  });
});
