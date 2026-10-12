/**
 * The energy goal through the real sync pipeline: Dexie on two devices sharing
 * one in-memory cloud, the goal cleared through the app's persistence, so the
 * clear is tombstoned exactly as in production. The goal's primary key is its
 * `profileId`, so its tombstone is filed under that id.
 */
import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import { createProfile } from "../../application/profile/create-profile";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import type { SnapshotPort } from "../../ports/snapshot-port";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import type { EnergyTargetRecord } from "../../types/energy-target-record";
import { createAppPersistence } from "../create-app-persistence";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

// One Dexie instance per device for the whole file (construction costs
// ~45 ms); each test still opens a brand-new database and afterEach drops it.
const suffix = `${Date.now()}-${Math.random()}`;
const databases = {
  a: new KaiordDatabase(`kaiord-test-goal-a-${suffix}`),
  b: new KaiordDatabase(`kaiord-test-goal-b-${suffix}`),
};
const open = async (label: keyof typeof databases) => {
  const db = databases[label];
  await db.open();
  return {
    db,
    persistence: createAppPersistence(db),
    snapshotPort: createDexieSnapshotPort(db),
  };
};

type Device = Awaited<ReturnType<typeof open>>;

const sync = (cloud: CloudSyncPort, device: Device, id: string) =>
  syncWithCloud({ cloud, snapshotPort: device.snapshotPort, deviceId: id });

const ONE_MINUTE_MS = 60_000;
const SAVED_AT = "2026-01-10T08:00:00.000Z";

const goal = (profileId: string, updatedAt: string): EnergyTargetRecord => ({
  profileId,
  goalType: "fat_loss",
  startWeightKg: 80,
  targetWeightKg: 75,
  targetDate: "2026-12-31",
  createdAt: SAVED_AT,
  updatedAt,
});

/** Both devices hold the same goal for a profile, synced through Drive. */
const goalOnBothDevices = async () => {
  const cloud = createInMemoryCloudSyncPort({
    authenticated: true,
    snapshot: null,
    revision: null,
    pushCount: 0,
  });
  const a = await open("a");
  const { id: profileId } = await createProfile(a.persistence, "Ana");
  await a.persistence.energyTargets.put(goal(profileId, SAVED_AT));
  await sync(cloud, a, "dev-a");
  const b = await open("b");
  await sync(cloud, b, "dev-b");
  return { cloud, a, b, profileId };
};

/** Runs `write` after the sync's export read, before its import transaction. */
const writeBeforeImport = (
  port: SnapshotPort,
  write: () => Promise<void>
): SnapshotPort => {
  let pending: (() => Promise<void>) | null = write;
  return {
    ...port,
    transaction: async (mode, scope) => {
      if (mode === "rw" && pending) {
        const run = pending;
        pending = null;
        await run();
      }
      return port.transaction(mode, scope);
    },
  };
};

afterEach(async () => {
  for (const db of Object.values(databases)) await db.delete();
});

describe("energy goal sync between two devices", () => {
  it("should keep a goal cleared on device A cleared on both devices", async () => {
    // Arrange
    const { cloud, a, b, profileId } = await goalOnBothDevices();
    expect(await b.persistence.energyTargets.get(profileId)).toBeDefined();
    await a.persistence.energyTargets.delete(profileId);

    // Act
    await sync(cloud, a, "dev-a");
    await sync(cloud, b, "dev-b");
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await a.persistence.energyTargets.get(profileId)).toBeUndefined();
    expect(await b.persistence.energyTargets.get(profileId)).toBeUndefined();
    expect(cloud.state.snapshot?.tables.energyTargets ?? []).toEqual([]);
  });

  it("should record the clear as a tombstone filed under the profile id", async () => {
    // Arrange
    const { a, profileId } = await goalOnBothDevices();

    // Act
    await a.persistence.energyTargets.delete(profileId);

    // Assert
    const tombstones = await a.db.table("tombstones").toArray();
    expect(tombstones).toEqual([
      expect.objectContaining({ table: "energyTargets", id: profileId }),
    ]);
  });

  it("should let a goal saved on device B after the clear win over it", async () => {
    // Arrange
    const { cloud, a, b, profileId } = await goalOnBothDevices();
    await a.persistence.energyTargets.delete(profileId);
    await sync(cloud, a, "dev-a");
    const later = new Date(Date.now() + ONE_MINUTE_MS).toISOString();
    const resaved = goal(profileId, later);
    await b.persistence.energyTargets.put(resaved);

    // Act
    await sync(cloud, b, "dev-b");
    await sync(cloud, a, "dev-a");

    // Assert
    expect(await a.persistence.energyTargets.get(profileId)).toEqual(resaved);
    expect(await b.persistence.energyTargets.get(profileId)).toEqual(resaved);
  });

  it("should keep a goal cleared while a sync is between its export and its import cleared", async () => {
    // Arrange
    const { cloud, a, profileId } = await goalOnBothDevices();
    const racing = writeBeforeImport(a.snapshotPort, () =>
      a.persistence.energyTargets.delete(profileId)
    );

    // Act
    await syncWithCloud({ cloud, snapshotPort: racing, deviceId: "dev-a" });

    // Assert
    expect(await a.persistence.energyTargets.get(profileId)).toBeUndefined();
    expect(cloud.state.snapshot?.tables.energyTargets ?? []).toEqual([]);
  });
});
