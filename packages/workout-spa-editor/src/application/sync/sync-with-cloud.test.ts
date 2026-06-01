import { describe, expect, it } from "vitest";

import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import type { Snapshot } from "../../types/snapshot";
import { syncWithCloud } from "./sync-with-cloud";

const remoteSnapshot = (): Snapshot => ({
  manifest: {
    schemaVersion: 19,
    deviceId: "other",
    exportedAt: "2026-05-25T00:00:00Z",
    encrypted: false,
  },
  tables: {
    workouts: [{ id: "w-remote", updatedAt: "2026-05-25T00:00:00Z" }],
  },
  tombstones: [],
});

const localState = () => ({
  schemaVersion: 19,
  tables: {
    workouts: [
      { id: "w-local", updatedAt: "2026-05-20T00:00:00Z" },
    ] as unknown[],
  },
  tombstones: [],
});

describe("syncWithCloud", () => {
  it("should pull, merge, import, and push the merged snapshot", async () => {
    // Arrange
    const snapshotState = localState();
    const snapshotPort = createInMemorySnapshotPort(snapshotState);
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: remoteSnapshot(),
      revision: "rev-0",
      pushCount: 0,
    });

    // Act
    const result = await syncWithCloud({
      cloud,
      snapshotPort,
      deviceId: "dev-1",
    });

    // Assert
    const ids = (snapshotState.tables.workouts as Array<{ id: string }>).map(
      (r) => r.id
    );
    expect(ids.sort()).toEqual(["w-local", "w-remote"]);
    expect(cloud.state.pushCount).toBe(1);
    expect(result.revision).toBe(cloud.state.revision);
  });

  it("should push directly and record the returned revision when remote is unchanged", async () => {
    // Arrange
    const snapshotPort = createInMemorySnapshotPort(localState());
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: remoteSnapshot(),
      revision: "rev-0",
      pushCount: 0,
    });

    // Act
    const result = await syncWithCloud({ cloud, snapshotPort, deviceId: "d" });

    // Assert
    expect(cloud.state.pushCount).toBe(1);
    expect(result.revision).toBe("rev-1");
  });

  it("should re-pull and re-merge when the remote revision moved", async () => {
    // Arrange
    const snapshotPort = createInMemorySnapshotPort(localState());
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: remoteSnapshot(),
      revision: "rev-0",
      pushCount: 0,
    });
    let firstPull = true;
    const originalPull = cloud.pull.bind(cloud);
    cloud.pull = async () => {
      const out = await originalPull();
      if (firstPull) {
        firstPull = false;
        // Another device pushes between our pull and push, moving revision.
        cloud.state.revision = "rev-moved";
      }
      return out;
    };

    // Act
    const result = await syncWithCloud({ cloud, snapshotPort, deviceId: "d" });

    // Assert
    expect(cloud.state.pushCount).toBe(1);
    expect(result.revision).toBe(cloud.state.revision);
  });

  it("should create the remote file when no snapshot exists yet", async () => {
    // Arrange
    const snapshotPort = createInMemorySnapshotPort(localState());
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });

    // Act
    const result = await syncWithCloud({ cloud, snapshotPort, deviceId: "d" });

    // Assert
    expect(cloud.state.pushCount).toBe(1);
    expect(result.revision).toBe("rev-1");
  });
});
