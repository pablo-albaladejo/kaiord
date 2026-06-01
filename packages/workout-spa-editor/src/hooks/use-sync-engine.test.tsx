import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryCloudSyncPort } from "../test-utils/in-memory-cloud-sync-port";
import {
  createInMemorySnapshotPort,
  type InMemorySnapshotState,
} from "../test-utils/in-memory-snapshot-port";
import type { Snapshot } from "../types/snapshot";
import { useSyncEngine } from "./use-sync-engine";

// eslint-disable-next-line no-magic-numbers -- explicit debounce window for clarity
const PUSH_DEBOUNCE_MS = 5000 as const;

const DEVICE_ID = "device-test" as const;

function makeSnapshotState(): InMemorySnapshotState {
  return { schemaVersion: 19, tables: { workouts: [] }, tombstones: [] };
}

function snapshotWith(rows: ReadonlyArray<unknown>): Snapshot {
  return {
    manifest: {
      schemaVersion: 19,
      deviceId: "remote",
      exportedAt: "2026-01-01T00:00:00.000Z",
      encrypted: false,
    },
    tables: { workouts: rows },
    tombstones: [],
  };
}

describe("useSyncEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should start idle and not connected", () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort();
    const snapshotPort = createInMemorySnapshotPort(makeSnapshotState());

    // Act
    const { result } = renderHook(() =>
      useSyncEngine({ cloud, snapshotPort, deviceId: DEVICE_ID })
    );

    // Assert
    expect(result.current.status).toBe("idle");
    expect(result.current.connected).toBe(false);
    expect(result.current.lastSyncedAt).toBeNull();
  });

  it("should apply a remote snapshot on pull-merge via syncNow", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: snapshotWith([
        { id: "w1", updatedAt: "2030-01-01T00:00:00.000Z" },
      ]),
      revision: "rev-0",
      pushCount: 0,
    });
    const state = makeSnapshotState();
    const snapshotPort = createInMemorySnapshotPort(state);

    // Act
    const { result } = renderHook(() =>
      useSyncEngine({ cloud, snapshotPort, deviceId: DEVICE_ID })
    );
    await act(async () => {
      await result.current.syncNow();
    });

    // Assert
    expect(state.tables.workouts).toEqual([
      { id: "w1", updatedAt: "2030-01-01T00:00:00.000Z" },
    ]);
    expect(result.current.lastSyncedAt).not.toBeNull();
  });

  it("should collapse a burst of edits into a single debounced push", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    const snapshotPort = createInMemorySnapshotPort(makeSnapshotState());
    const { result } = renderHook(() =>
      useSyncEngine({ cloud, snapshotPort, deviceId: DEVICE_ID })
    );

    // Act
    act(() => {
      result.current.requestPush();
      result.current.requestPush();
      result.current.requestPush();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PUSH_DEBOUNCE_MS);
    });

    // Assert
    expect(cloud.state.pushCount).toBe(1);
  });

  it("should surface a sync failure non-fatally as error status", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    cloud.pull = vi.fn(async () => {
      throw new Error("offline");
    });
    const snapshotPort = createInMemorySnapshotPort(makeSnapshotState());
    const { result } = renderHook(() =>
      useSyncEngine({ cloud, snapshotPort, deviceId: DEVICE_ID })
    );

    // Act
    await act(async () => {
      await result.current.syncNow();
    });

    // Assert
    expect(result.current.status).toBe("error");
    expect(result.current.error).not.toBeNull();
  });

  it("should mark connected after a successful connect", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort();
    const snapshotPort = createInMemorySnapshotPort(makeSnapshotState());
    const { result } = renderHook(() =>
      useSyncEngine({ cloud, snapshotPort, deviceId: DEVICE_ID })
    );

    // Act
    await act(async () => {
      await result.current.connect();
    });

    // Assert
    expect(result.current.connected).toBe(true);
  });

  it("should stop pushing after disconnect", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    const snapshotPort = createInMemorySnapshotPort(makeSnapshotState());
    const { result } = renderHook(() =>
      useSyncEngine({ cloud, snapshotPort, deviceId: DEVICE_ID })
    );

    // Act
    act(() => {
      result.current.disconnect();
      result.current.requestPush();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PUSH_DEBOUNCE_MS);
    });

    // Assert
    expect(cloud.state.pushCount).toBe(0);
    expect(result.current.connected).toBe(false);
  });
});
