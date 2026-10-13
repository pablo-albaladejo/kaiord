import { describe, expect, it } from "vitest";

import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import type { Snapshot } from "../../types/snapshot";
import { syncWithCloud } from "../sync/sync-with-cloud";
import { wipeAllData } from "./wipe-all-data";

const REMOTE_PROFILE = {
  id: "p-remote",
  name: "Pablo",
  origin: "user",
  updatedAt: "2026-10-01T00:00:00Z",
};

const seededState = () => ({
  schemaVersion: 37,
  tables: {
    profiles: [REMOTE_PROFILE] as unknown[],
    workouts: [
      { id: "w-1", profileId: "p-remote", updatedAt: "2026-10-01T00:00:00Z" },
    ] as unknown[],
    // A table no code names: a store added by a later schema version.
    someFutureTable: [{ id: "x-1" }] as unknown[],
  },
  tombstones: [
    { table: "workouts", id: "w-0", deletedAt: "2026-09-01T00:00:00Z" },
  ],
  deviceLocal: { connections: [{ id: "c-1" }] as unknown[] },
});

const remoteSnapshot = (): Snapshot => ({
  manifest: {
    schemaVersion: 37,
    deviceId: "other",
    exportedAt: "2026-10-01T00:00:00Z",
    encrypted: false,
  },
  tables: {
    profiles: [REMOTE_PROFILE],
    workouts: [
      { id: "w-1", profileId: "p-remote", updatedAt: "2026-10-01T00:00:00Z" },
    ],
  },
  tombstones: [],
});

describe("wipeAllData", () => {
  it("should empty every table, the tombstones and the device-local stores", async () => {
    // Arrange
    const state = seededState();
    const snapshotPort = createInMemorySnapshotPort(state);

    // Act
    await wipeAllData({
      snapshotPort,
      stopSync: () => undefined,
      clearDeviceStorage: () => undefined,
    });

    // Assert
    for (const rows of Object.values(state.tables)) expect(rows).toEqual([]);
    expect(state.tombstones).toEqual([]);
    expect(state.deviceLocal).toEqual({ connections: [] });
  });

  it("should stop sync before the database is touched and clear device storage after it", async () => {
    // Arrange
    const state = seededState();
    const calls: string[] = [];
    const port = createInMemorySnapshotPort(state);
    const snapshotPort = {
      ...port,
      clearAllTables: async () => {
        calls.push("clearAllTables");
        await port.clearAllTables();
      },
    };

    // Act
    await wipeAllData({
      snapshotPort,
      stopSync: () => calls.push("stopSync"),
      clearDeviceStorage: () => calls.push("clearDeviceStorage"),
    });

    // Assert
    expect(calls).toEqual(["stopSync", "clearAllTables", "clearDeviceStorage"]);
  });

  it("should keep device storage when the database wipe fails", async () => {
    // Arrange
    const port = createInMemorySnapshotPort(seededState());
    let storageCleared = false;
    const snapshotPort = {
      ...port,
      clearAllTables: () => Promise.reject(new Error("quota")),
    };

    // Act
    const run = wipeAllData({
      snapshotPort,
      stopSync: () => undefined,
      clearDeviceStorage: () => {
        storageCleared = true;
      },
    });

    // Assert
    await expect(run).rejects.toThrow("quota");
    expect(storageCleared).toBe(false);
  });

  it("should leave the Drive copy whole when this browser syncs again after a wipe", async () => {
    // Arrange
    const state = seededState();
    const snapshotPort = createInMemorySnapshotPort(state);
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: remoteSnapshot(),
      revision: "rev-0",
      pushCount: 0,
    });
    await wipeAllData({
      snapshotPort,
      stopSync: () => undefined,
      clearDeviceStorage: () => undefined,
    });

    // Act
    await syncWithCloud({ cloud, snapshotPort, deviceId: "dev-1" });

    // Assert
    const pushed = cloud.state.snapshot?.tables.workouts as Array<{
      id: string;
    }>;
    expect(pushed.map((w) => w.id)).toEqual(["w-1"]);
    expect(cloud.state.snapshot?.tombstones).toEqual([]);
  });
});
