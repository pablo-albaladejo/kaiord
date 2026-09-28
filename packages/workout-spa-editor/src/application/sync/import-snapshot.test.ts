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
    await importSnapshot({
      port,
      snapshot: snapshot(),
      now: () => new Date("2026-06-01T00:00:00Z"),
    });

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

describe("importSnapshot — exportLedger live merge (in-memory port)", () => {
  it("should keep untombstoned live ledger rows and drop tombstoned ones", async () => {
    // Arrange
    const ledgerRow = (id: string) => ({
      id,
      kaiordRecordId: `rec-${id}`,
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: `ext-${id}`,
      exportedAt: "2026-09-01T00:00:00.000Z",
    });
    const state = {
      schemaVersion: 19,
      tables: {
        exportLedger: [ledgerRow("kept"), ledgerRow("gone")] as unknown[],
        workouts: [{ id: "stale" }] as unknown[],
      },
      tombstones: [],
    };
    const port = createInMemorySnapshotPort(state);
    const incoming: Snapshot = {
      ...snapshot(),
      tables: { exportLedger: [ledgerRow("new")], workouts: [] },
      tombstones: [
        {
          table: "exportLedger",
          id: "gone",
          deletedAt: "2026-09-02T00:00:00Z",
        },
      ],
    };

    // Act
    await importSnapshot({
      port,
      snapshot: incoming,
      now: () => new Date("2026-09-03T00:00:00Z"),
    });

    // Assert
    const ids = (state.tables.exportLedger as Array<{ id: string }>).map(
      (r) => r.id
    );
    expect(ids.sort()).toEqual(["kept", "new"]);
    expect(state.tables.workouts).toEqual([]);
  });
});

describe("importSnapshot — live tombstones", () => {
  it("should keep a tombstone written after the export and suppress its row", async () => {
    // Arrange
    const late = {
      table: "exportLedger",
      id: "late",
      deletedAt: "2026-09-02T00:00:00.000Z",
    };
    const state = {
      schemaVersion: 19,
      tables: { exportLedger: [] as unknown[] },
      tombstones: [late],
    };
    const port = createInMemorySnapshotPort(state);
    const stale: Snapshot = {
      ...snapshot(),
      tables: {
        exportLedger: [
          {
            id: "late",
            kaiordRecordId: "rec-late",
            destinationBridgeId: "garmin-bridge",
            destinationExternalId: "pending",
            exportedAt: "2026-09-01T00:00:00.000Z",
          },
        ],
      },
      tombstones: [],
    };

    // Act
    await importSnapshot({
      port,
      snapshot: stale,
      now: () => new Date("2026-09-03T00:00:00Z"),
    });

    // Assert
    expect(state.tables.exportLedger).toEqual([]);
    expect(state.tombstones).toEqual([late]);
  });
});
