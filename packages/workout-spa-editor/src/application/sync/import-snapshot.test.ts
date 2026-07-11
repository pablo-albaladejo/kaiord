import { describe, expect, it } from "vitest";

import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import type { Snapshot } from "../../types/snapshot";
import { exportSnapshot } from "./export-snapshot";
import { importSnapshot } from "./import-snapshot";

const snapshot = (): Snapshot => ({
  manifest: {
    schemaVersion: 19,
    deviceId: "dev-2",
    exportedAt: "2026-05-31T12:00:00.000Z",
    encrypted: false,
  },
  tables: {
    workouts: [{ id: "w-9" }],
    templates: [],
    profiles: [{ id: "p-2" }],
    aiProviders: [],
    syncState: [],
  },
  tombstones: [
    { table: "templates", id: "t-old", deletedAt: "2026-05-20T00:00:00Z" },
  ],
});

describe("importSnapshot", () => {
  it("should clear and restore every table from the snapshot", async () => {
    // Arrange
    const state = {
      schemaVersion: 19,
      tables: {
        workouts: [{ id: "stale" }],
        templates: [{ id: "stale-t" }],
        profiles: [],
        aiProviders: [],
        syncState: [],
      },
      tombstones: [] as Snapshot["tombstones"] extends infer T ? T : never,
    };
    const port = createInMemorySnapshotPort(state as never);

    // Act
    await importSnapshot({ port, snapshot: snapshot() });

    // Assert
    expect(state.tables.workouts).toEqual([{ id: "w-9" }]);
    expect(state.tables.templates).toEqual([]);
    expect(state.tombstones).toEqual([
      { table: "templates", id: "t-old", deletedAt: "2026-05-20T00:00:00Z" },
    ]);
  });

  it("should prune tombstones older than the retention window on import", async () => {
    // Arrange
    const state = {
      schemaVersion: 19,
      tables: {
        workouts: [],
        templates: [],
        profiles: [],
        aiProviders: [],
        syncState: [],
      },
      tombstones: [],
    };
    const port = createInMemorySnapshotPort(state as never);
    const withStale: Snapshot = {
      ...snapshot(),
      tombstones: [
        { table: "templates", id: "t-old", deletedAt: "2026-05-20T00:00:00Z" },
        { table: "workouts", id: "ancient", deletedAt: "2026-01-01T00:00:00Z" },
      ],
    };

    // Act
    await importSnapshot({
      port,
      snapshot: withStale,
      now: () => new Date("2026-06-01T00:00:00Z"),
    });

    // Assert
    expect(
      (state.tombstones as Array<{ id: string }>).map((t) => t.id)
    ).toEqual(["t-old"]);
  });

  it("should reject a snapshot from a newer schema version", async () => {
    // Arrange
    const port = createInMemorySnapshotPort({
      schemaVersion: 19,
      tables: {
        workouts: [],
        templates: [],
        profiles: [],
        aiProviders: [],
        syncState: [],
      },
      tombstones: [],
    } as never);
    const newer: Snapshot = {
      ...snapshot(),
      manifest: { ...snapshot().manifest, schemaVersion: 20 },
    };

    // Act
    const attempt = importSnapshot({ port, snapshot: newer });

    // Assert
    await expect(attempt).rejects.toThrow(/newer than/i);
  });

  it("should round-trip export then import preserving every row", async () => {
    // Arrange
    const source = {
      schemaVersion: 19,
      tables: {
        workouts: [{ id: "w-1" }, { id: "w-2" }],
        profiles: [{ id: "p-1" }],
        aiProviders: [{ id: "ai-1", encryptedKey: "ciphertext-blob" }],
      },
      tombstones: [],
    };
    const sourcePort = createInMemorySnapshotPort(source as never);
    const exported = await exportSnapshot({
      port: sourcePort,
      deviceId: "dev-1",
    });
    const target = {
      schemaVersion: 19,
      tables: { workouts: [], profiles: [], aiProviders: [] },
      tombstones: [],
    };
    const targetPort = createInMemorySnapshotPort(target as never);

    // Act
    await importSnapshot({ port: targetPort, snapshot: exported });

    // Assert
    expect(target.tables.workouts).toHaveLength(2);
    expect(target.tables.aiProviders).toEqual([
      { id: "ai-1", encryptedKey: "ciphertext-blob" },
    ]);
  });
});
