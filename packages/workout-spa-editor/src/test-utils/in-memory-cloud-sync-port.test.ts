import { describe, expect, it } from "vitest";

import type { Snapshot } from "../types/snapshot";
import { createInMemoryCloudSyncPort } from "./in-memory-cloud-sync-port";

function makeSnapshot(deviceId: string): Snapshot {
  return {
    manifest: {
      schemaVersion: 19,
      deviceId,
      exportedAt: "2026-01-01T00:00:00.000Z",
      encrypted: false,
    },
    tables: { workouts: [] },
    tombstones: [],
  };
}

describe("createInMemoryCloudSyncPort", () => {
  it("should report authenticated only after authenticate resolves", async () => {
    // Arrange
    const port = createInMemoryCloudSyncPort();

    // Act
    const before = port.isAuthenticated();
    await port.authenticate();
    const after = port.isAuthenticated();

    // Assert
    expect(before).toBe(false);
    expect(after).toBe(true);
  });

  it("should return null from pull when no snapshot has been pushed", async () => {
    // Arrange
    const port = createInMemoryCloudSyncPort();

    // Act
    const result = await port.pull();

    // Assert
    expect(result).toBeNull();
  });

  it("should return the pushed snapshot and a revision from pull", async () => {
    // Arrange
    const port = createInMemoryCloudSyncPort();
    const snapshot = makeSnapshot("dev-a");

    // Act
    const revision = await port.push(snapshot, null);
    const pulled = await port.pull();

    // Assert
    expect(pulled).not.toBeNull();
    expect(pulled?.snapshot).toEqual(snapshot);
    expect(pulled?.headRevisionId).toBe(revision);
  });

  it("should advance the revision on each successful push", async () => {
    // Arrange
    const port = createInMemoryCloudSyncPort();

    // Act
    const first = await port.push(makeSnapshot("dev-a"), null);
    const second = await port.push(makeSnapshot("dev-b"), first);

    // Assert
    expect(second).not.toBe(first);
  });

  it("should reject a push whose expected revision is stale", async () => {
    // Arrange
    const port = createInMemoryCloudSyncPort();
    await port.push(makeSnapshot("dev-a"), null);

    // Act
    const act = () => port.push(makeSnapshot("dev-b"), "stale-revision");

    // Assert
    await expect(act()).rejects.toThrow();
  });
});
