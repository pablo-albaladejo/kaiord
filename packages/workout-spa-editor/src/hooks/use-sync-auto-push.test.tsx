/**
 * useSyncAutoPush over the real (fake-indexeddb) database: a write to any
 * synced table must arm a debounced push, a device-local write must not,
 * and neither must the writes a sync import makes itself.
 */
import "fake-indexeddb/auto";

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAppPersistence } from "../adapters/create-app-persistence";
import { db } from "../adapters/dexie/dexie-database";
import { createDexieSnapshotPort } from "../adapters/dexie/dexie-snapshot-port";
import { logIntakeEntry } from "../application/nutrition/log-intake-entry.use-case";
import { useSyncAutoPush } from "./use-sync-auto-push";

const requestPush = vi.fn();
const sync = { connected: true, requestPush };

vi.mock("../contexts/sync-context", () => ({ useSync: () => sync }));

const TOUCHED = ["intakeEntries", "healthSleep", "connections", "workouts"];
const persistence = createAppPersistence(db);

beforeEach(async () => {
  for (const name of TOUCHED) await db.table(name).clear();
  requestPush.mockReset();
  sync.connected = true;
});

afterEach(async () => {
  for (const name of TOUCHED) await db.table(name).clear();
});

describe("useSyncAutoPush", () => {
  it("should schedule a push when an intake is logged", async () => {
    // Arrange
    renderHook(() => useSyncAutoPush());

    // Act
    await logIntakeEntry(
      { persistence, profileId: "p-1" },
      { date: "2026-10-11", kcal: 500, proteinG: 30, carbG: 60, fatG: 15 }
    );

    // Assert
    expect(requestPush).toHaveBeenCalled();
  });

  it("should schedule a push for a synced table the old token never watched", async () => {
    // Arrange
    renderHook(() => useSyncAutoPush());

    // Act
    await db.table("healthSleep").put({ id: "s-1", profileId: "p-1" });

    // Assert
    expect(requestPush).toHaveBeenCalledTimes(1);
  });

  it("should not schedule a push for a device-local table", async () => {
    // Arrange
    renderHook(() => useSyncAutoPush());

    // Act
    await db
      .table("connections")
      .put({ profileId: "p-1", providerId: "whoop" });

    // Assert
    expect(requestPush).not.toHaveBeenCalled();
  });

  it("should not schedule a push for the writes of a sync import", async () => {
    // Arrange
    renderHook(() => useSyncAutoPush());
    const port = createDexieSnapshotPort(db);

    // Act
    await port.transaction("rw", async () => {
      await port.importTables(
        { workouts: [{ id: "w-1", updatedAt: "2026-10-11T00:00:00.000Z" }] },
        { liveMerge: () => undefined }
      );
      await port.replaceTombstones([]);
    });

    // Assert
    expect(await db.table("workouts").count()).toBe(1);
    expect(requestPush).not.toHaveBeenCalled();
  });

  it("should not schedule a push while disconnected", async () => {
    // Arrange
    sync.connected = false;
    renderHook(() => useSyncAutoPush());

    // Act
    await db.table("workouts").put({ id: "w-2" });

    // Assert
    expect(requestPush).not.toHaveBeenCalled();
  });
});
