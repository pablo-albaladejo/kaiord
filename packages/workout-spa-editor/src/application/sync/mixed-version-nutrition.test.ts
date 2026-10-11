/**
 * Mixed app versions on one Drive. A device still on the build where the
 * nutrition stores were device-local exports a snapshot WITHOUT
 * `intakeEntries`, `intakePresets` and `energyTargets`, and its Dexie adapter
 * ignores those tables on import. A table missing on one side must mean "no
 * information", never "empty": otherwise the old device's next push would
 * wipe the nutrition another device synced.
 */
import { describe, expect, it } from "vitest";

import type { SnapshotPort } from "../../ports/snapshot-port";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import type { Snapshot, SnapshotTables } from "../../types/snapshot";
import { mergeSnapshots } from "./merge-snapshots";
import { syncWithCloud } from "./sync-with-cloud";

const NUTRITION = ["intakeEntries", "intakePresets", "energyTargets"];
const OLD_SCHEMA = 36;
const NEW_SCHEMA = 37;
const PROFILE = { id: "p-1", name: "Me", updatedAt: "2026-10-01T00:00:00Z" };

const nutritionTables = () => ({
  intakeEntries: [
    {
      id: "i-1",
      profileId: "p-1",
      date: "2026-10-10",
      loggedAt: "2026-10-10T08:00:00.000Z",
      updatedAt: "2026-10-10T08:00:00.000Z",
      kcal: 500,
      proteinG: 30,
      carbG: 60,
      fatG: 15,
    },
  ],
  intakePresets: [
    {
      id: "pre-1",
      profileId: "p-1",
      label: "Oats",
      kcal: 350,
      proteinG: 12,
      carbG: 55,
      fatG: 7,
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
    },
  ],
  energyTargets: [
    {
      profileId: "p-1",
      goalType: "fat_loss",
      startWeightKg: 80,
      targetWeightKg: 75,
      targetDate: "2027-01-01",
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
    },
  ],
});

const newDeviceSnapshot = (exportedAt: string): Snapshot => ({
  manifest: {
    schemaVersion: NEW_SCHEMA,
    deviceId: "dev-new",
    exportedAt,
    encrypted: false,
  },
  tables: { profiles: [PROFILE], ...nutritionTables() },
  tombstones: [
    { table: "intakeEntries", id: "i-gone", deletedAt: "2026-10-09T00:00:00Z" },
  ],
});

const withoutNutrition = (tables: SnapshotTables): SnapshotTables =>
  Object.fromEntries(
    Object.entries(tables).filter(([name]) => !NUTRITION.includes(name))
  );

/** The pre-PR4d Dexie adapter: nutrition never leaves or enters the snapshot. */
const oldBuild = (port: SnapshotPort): SnapshotPort => ({
  ...port,
  exportTables: async () => withoutNutrition(await port.exportTables()),
  importTables: (tables, options) =>
    port.importTables(withoutNutrition(tables), options),
});

const oldDevice = () => {
  const state = {
    schemaVersion: OLD_SCHEMA,
    tables: {
      profiles: [PROFILE],
      workouts: [{ id: "w-1", profileId: "p-1", updatedAt: "2026-10-11Z" }],
    } as Record<string, unknown[]>,
    tombstones: [],
  };
  return { state, port: oldBuild(createInMemorySnapshotPort(state)) };
};

describe("nutrition sync across app versions", () => {
  it("should keep the remote nutrition rows when the local snapshot has no nutrition tables", () => {
    // Arrange
    const local: Snapshot = {
      manifest: {
        schemaVersion: OLD_SCHEMA,
        deviceId: "dev-old",
        exportedAt: "2026-10-11T00:00:00Z",
        encrypted: false,
      },
      tables: { profiles: [PROFILE] },
      tombstones: [],
    };
    const remote = newDeviceSnapshot("2026-10-10T00:00:00Z");

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    for (const name of NUTRITION)
      expect(merged.tables[name]).toEqual(remote.tables[name]);
    expect(merged.tombstones).toEqual(remote.tombstones);
  });

  it("should keep the Drive nutrition through two sync cycles of an old-build device", async () => {
    // Arrange
    const remote = newDeviceSnapshot("2026-10-10T00:00:00Z");
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: remote,
      revision: "rev-0",
      pushCount: 0,
    });
    const old = oldDevice();

    // Act
    await syncWithCloud({ cloud, snapshotPort: old.port, deviceId: "old" });
    await syncWithCloud({ cloud, snapshotPort: old.port, deviceId: "old" });

    // Assert
    expect(cloud.state.pushCount).toBe(2);
    const pushed = cloud.state.snapshot as Snapshot;
    for (const name of NUTRITION)
      expect(pushed.tables[name]).toEqual(remote.tables[name]);
    expect(pushed.tables.workouts).toHaveLength(1);
    expect(pushed.tombstones).toEqual(
      expect.arrayContaining(remote.tombstones)
    );
  });

  it("should not import or push when the newer remote manifest wins the merge", async () => {
    // Arrange
    // A remote exported "after" the old device's clock (skew) carries the
    // merged manifest, whose newer schema the old app refuses to import.
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: newDeviceSnapshot("2099-01-01T00:00:00Z"),
      revision: "rev-0",
      pushCount: 0,
    });
    const old = oldDevice();

    // Act
    const run = syncWithCloud({
      cloud,
      snapshotPort: old.port,
      deviceId: "old",
      maxRetries: 0,
    });

    // Assert
    await expect(run).rejects.toThrow(/newer than this app/);
    expect(cloud.state.pushCount).toBe(0);
  });
});
