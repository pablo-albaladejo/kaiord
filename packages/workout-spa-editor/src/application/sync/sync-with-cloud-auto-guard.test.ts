import { describe, expect, it, vi } from "vitest";

import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import type { Snapshot } from "../../types/snapshot";
import { syncWithCloud } from "./sync-with-cloud";

const AUTO_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

// Stands in for a reconcile regression: the guard must hold even when the
// step meant to remove the auto profile lets it through.
vi.mock("./reconcile-auto-profile", () => ({
  AUTO_PROFILE_CHOICE_KEY: "autoProfileChoice",
  reconcileAutoProfile: (merged: Snapshot) => ({
    kind: "ready",
    snapshot: merged,
    deviceLocalRekey: null,
  }),
}));

const pushingCloud = () => {
  const push = vi.fn(async () => "rev-1");
  const cloud: CloudSyncPort = {
    isAuthenticated: () => true,
    authenticate: async () => undefined,
    pull: async () => null,
    push,
  };
  return { cloud, push };
};

describe("syncWithCloud auto-profile guard", () => {
  it("should refuse to push or import a snapshot that still carries an origin:auto profile", async () => {
    // Arrange
    const state = {
      schemaVersion: 36,
      tables: {
        profiles: [{ id: AUTO_ID, name: "My profile", origin: "auto" }],
      } as Record<string, unknown[]>,
      tombstones: [],
    };
    const snapshotPort = createInMemorySnapshotPort(state);
    const importSpy = vi.spyOn(snapshotPort, "importTables");
    const { cloud, push } = pushingCloud();

    // Act
    const sync = syncWithCloud({ cloud, snapshotPort, deviceId: "d" });

    // Assert
    await expect(sync).rejects.toThrow(/origin:auto profile/);
    expect(push).not.toHaveBeenCalled();
    expect(importSpy).not.toHaveBeenCalled();
  });
});
