/**
 * Every cloud import is followed by the match-date heal (design §3.5, §3.14),
 * so a torn merge resolves to the workout's date before the next render.
 */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import { syncWithCloud } from "./sync-with-cloud";

const REMOTE_AT = "2026-10-05T00:00:00Z";

describe("syncWithCloud after import", () => {
  it("should run afterImport once the merged snapshot is imported", async () => {
    // Arrange
    const state = { schemaVersion: 40, tables: {}, tombstones: [] };
    const snapshotPort = createInMemorySnapshotPort(state);
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: {
        manifest: {
          schemaVersion: 40,
          deviceId: "other",
          exportedAt: REMOTE_AT,
          encrypted: false,
        },
        tables: { workouts: [{ id: "w-remote", updatedAt: REMOTE_AT }] },
        tombstones: [],
      },
      revision: "rev-0",
      pushCount: 0,
    });
    const seen: unknown[] = [];
    const afterImport = vi.fn(async () => {
      seen.push(
        ...((state.tables as Record<string, unknown[]>).workouts ?? [])
      );
    });

    // Act
    await syncWithCloud({ cloud, snapshotPort, deviceId: "d", afterImport });

    // Assert
    expect(afterImport).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([{ id: "w-remote", updatedAt: REMOTE_AT }]);
  });
});
