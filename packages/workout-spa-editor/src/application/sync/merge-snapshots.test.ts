import { describe, expect, it } from "vitest";

import type { Snapshot, Tombstone } from "../../types/snapshot";
import { mergeSnapshots } from "./merge-snapshots";

const manifest = (exportedAt: string) => ({
  schemaVersion: 19,
  deviceId: "dev",
  exportedAt,
  encrypted: false,
});

const snap = (
  exportedAt: string,
  tables: Snapshot["tables"],
  tombstones: ReadonlyArray<Tombstone> = []
): Snapshot => ({ manifest: manifest(exportedAt), tables, tombstones });

const rows = (table: string, merged: Snapshot) =>
  (merged.tables[table] ?? []) as Array<Record<string, unknown>>;

describe("mergeSnapshots — per-record LWW", () => {
  it("should keep the local copy when its updatedAt is newer", () => {
    // Arrange
    const local = snap("2026-05-20T00:00:00Z", {
      workouts: [{ id: "w-1", updatedAt: "2026-05-20T00:00:00Z", v: "L" }],
    });
    const remote = snap("2026-05-19T00:00:00Z", {
      workouts: [{ id: "w-1", updatedAt: "2026-05-10T00:00:00Z", v: "R" }],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("workouts", merged)).toEqual([
      { id: "w-1", updatedAt: "2026-05-20T00:00:00Z", v: "L" },
    ]);
  });

  it("should keep the remote copy when its updatedAt is newer", () => {
    // Arrange
    const local = snap("2026-05-19T00:00:00Z", {
      workouts: [{ id: "w-1", updatedAt: "2026-05-10T00:00:00Z", v: "L" }],
    });
    const remote = snap("2026-05-20T00:00:00Z", {
      workouts: [{ id: "w-1", updatedAt: "2026-05-20T00:00:00Z", v: "R" }],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("workouts", merged)[0].v).toBe("R");
  });

  it("should keep a record present on only one side", () => {
    // Arrange
    const local = snap("2026-05-20T00:00:00Z", {
      templates: [{ id: "t-1", updatedAt: "2026-05-20T00:00:00Z" }],
    });
    const remote = snap("2026-05-20T00:00:00Z", { templates: [] });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("templates", merged)).toHaveLength(1);
  });

  it("should fall back to createdAt when updatedAt is absent", () => {
    // Arrange
    const local = snap("2026-05-20T00:00:00Z", {
      workouts: [{ id: "w-1", createdAt: "2026-05-01T00:00:00Z", v: "L" }],
    });
    const remote = snap("2026-05-20T00:00:00Z", {
      workouts: [{ id: "w-1", createdAt: "2026-05-09T00:00:00Z", v: "R" }],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("workouts", merged)[0].v).toBe("R");
  });
});

describe("mergeSnapshots — timestampless tables", () => {
  it("should keep the meta value from the later manifest exportedAt", () => {
    // Arrange
    const local = snap("2026-05-21T00:00:00Z", {
      meta: [{ key: "theme", value: "dark" }],
    });
    const remote = snap("2026-05-10T00:00:00Z", {
      meta: [{ key: "theme", value: "light" }],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("meta", merged)).toEqual([{ key: "theme", value: "dark" }]);
  });
});

describe("mergeSnapshots — usageEvents (synced append-only log)", () => {
  it("should union distinct usageEvents rows from both devices in the same month", () => {
    // Arrange
    const local = snap("2026-07-01T00:00:00Z", {
      usageEvents: [
        { id: "a", yearMonth: "2026-07", createdAt: "2026-07-01T00:00:00Z" },
      ],
    });
    const remote = snap("2026-07-02T00:00:00Z", {
      usageEvents: [
        { id: "b", yearMonth: "2026-07", createdAt: "2026-07-02T00:00:00Z" },
      ],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(
      rows("usageEvents", merged)
        .map((r) => r.id)
        .sort()
    ).toEqual(["a", "b"]);
  });

  it("should dedupe a usageEvents row present on both devices by id", () => {
    // Arrange
    const shared = {
      id: "a",
      yearMonth: "2026-07",
      createdAt: "2026-07-01T00:00:00Z",
    };
    const local = snap("2026-07-01T00:00:00Z", { usageEvents: [shared] });
    const remote = snap("2026-07-02T00:00:00Z", { usageEvents: [shared] });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("usageEvents", merged)).toHaveLength(1);
  });

  it("should suppress a tombstoned usageEvents row", () => {
    // Arrange
    const local = snap("2026-07-03T00:00:00Z", { usageEvents: [] }, [
      { table: "usageEvents", id: "a", deletedAt: "2026-07-03T00:00:00Z" },
    ]);
    const remote = snap("2026-07-02T00:00:00Z", {
      usageEvents: [
        { id: "a", yearMonth: "2026-07", createdAt: "2026-07-01T00:00:00Z" },
      ],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("usageEvents", merged)).toHaveLength(0);
  });
});

describe("mergeSnapshots — tombstones", () => {
  it("should remove a record whose tombstone is newer than its timestamp", () => {
    // Arrange
    const local = snap("2026-05-20T00:00:00Z", { workouts: [] }, [
      { table: "workouts", id: "w-1", deletedAt: "2026-05-15T00:00:00Z" },
    ]);
    const remote = snap("2026-05-20T00:00:00Z", {
      workouts: [{ id: "w-1", updatedAt: "2026-05-10T00:00:00Z" }],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("workouts", merged)).toHaveLength(0);
    expect(merged.tombstones).toContainEqual({
      table: "workouts",
      id: "w-1",
      deletedAt: "2026-05-15T00:00:00Z",
    });
  });

  it("should retain a record re-created after its tombstone", () => {
    // Arrange
    const local = snap("2026-05-20T00:00:00Z", {
      workouts: [{ id: "w-1", updatedAt: "2026-05-18T00:00:00Z", v: "new" }],
    });
    const remote = snap("2026-05-20T00:00:00Z", { workouts: [] }, [
      { table: "workouts", id: "w-1", deletedAt: "2026-05-15T00:00:00Z" },
    ]);

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("workouts", merged)).toHaveLength(1);
    expect(rows("workouts", merged)[0].v).toBe("new");
  });

  it("should union tombstones keeping the newest deletedAt per key", () => {
    // Arrange
    const local = snap("2026-05-20T00:00:00Z", { workouts: [] }, [
      { table: "workouts", id: "w-1", deletedAt: "2026-05-10T00:00:00Z" },
    ]);
    const remote = snap("2026-05-20T00:00:00Z", { workouts: [] }, [
      { table: "workouts", id: "w-1", deletedAt: "2026-05-16T00:00:00Z" },
    ]);

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(merged.tombstones).toEqual([
      { table: "workouts", id: "w-1", deletedAt: "2026-05-16T00:00:00Z" },
    ]);
  });
});

describe("mergeSnapshots — exportLedger natural key", () => {
  const ledgerRow = (id: string, updatedAt: string) => ({
    id,
    kaiordRecordId: "rec-1",
    destinationBridgeId: "garmin-bridge",
    destinationExternalId: `ext-${id}`,
    exportedAt: updatedAt,
    updatedAt,
  });

  it("should keep one row per natural key across different ids", () => {
    // Arrange
    const newer = ledgerRow("id-b", "2026-09-02T00:00:00.000Z");
    const local = snap("2026-09-03T00:00:00Z", {
      exportLedger: [ledgerRow("id-a", "2026-09-01T00:00:00.000Z")],
    });
    const remote = snap("2026-09-03T00:00:00Z", { exportLedger: [newer] });

    // Act
    const merged = [
      mergeSnapshots(local, remote),
      mergeSnapshots(remote, local),
    ];

    // Assert
    expect(rows("exportLedger", merged[0])).toEqual([newer]);
    expect(rows("exportLedger", merged[1])).toEqual([newer]);
  });

  it("should suppress a tombstoned survivor by its id", () => {
    // Arrange
    const local = snap(
      "2026-09-03T00:00:00Z",
      { exportLedger: [ledgerRow("id-a", "2026-09-01T00:00:00.000Z")] },
      [{ table: "exportLedger", id: "id-a", deletedAt: "2026-09-02T00:00:00Z" }]
    );
    const remote = snap("2026-09-03T00:00:00Z", { exportLedger: [] });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("exportLedger", merged)).toEqual([]);
  });
});

describe("mergeSnapshots — tombstone × pairwise merge order", () => {
  const T1 = "2026-09-01T00:00:00.000Z";
  const T2 = "2026-09-02T00:00:00.000Z";
  const T3 = "2026-09-03T00:00:00.000Z";
  const ledgerRow = (id: string, updatedAt: string) => ({
    id,
    kaiordRecordId: "rec-1",
    destinationBridgeId: "garmin-bridge",
    destinationExternalId: `ext-${id}`,
    exportedAt: updatedAt,
    updatedAt,
  });

  it("should be transiently order-dependent when the winner is tombstoned later", () => {
    // Arrange
    // A holds the newer row X, B its older sibling Y, C only X's tombstone.
    const a = snap(T3, { exportLedger: [ledgerRow("x", T2)] });
    const b = snap(T3, { exportLedger: [ledgerRow("y", T1)] });
    const c = snap(T3, { exportLedger: [] }, [
      { table: "exportLedger", id: "x", deletedAt: T3 },
    ]);

    // Act
    const xFirst = mergeSnapshots(mergeSnapshots(a, b), c);
    const tombstoneFirst = mergeSnapshots(mergeSnapshots(b, c), a);

    // Assert
    // Merging A×B before the tombstone drops Y; B still holding Y lets its
    // next sync (live import keeps Y) bring it back — convergence, not loss.
    expect(rows("exportLedger", xFirst)).toEqual([]);
    expect(rows("exportLedger", tombstoneFirst)).toEqual([ledgerRow("y", T1)]);
    expect(rows("exportLedger", mergeSnapshots(xFirst, b))).toEqual([
      ledgerRow("y", T1),
    ]);
  });
});

describe("mergeSnapshots — composite-key tables without an id", () => {
  it("should keep one dataTypeSourcePolicy row per profile and data type", () => {
    // Arrange
    const policy = (profileId: string, dataType: string) => ({
      profileId,
      dataType,
      mode: "union",
      sourceOrder: [],
    });
    const local = snap("2026-05-20T00:00:00Z", {
      dataTypeSourcePolicy: [policy("p-1", "sleep"), policy("p-1", "weight")],
    });
    const remote = snap("2026-05-19T00:00:00Z", {
      dataTypeSourcePolicy: [policy("p-2", "sleep")],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    const keys = rows("dataTypeSourcePolicy", merged)
      .map((r) => `${String(r.profileId)}/${String(r.dataType)}`)
      .sort();
    expect(keys).toEqual(["p-1/sleep", "p-1/weight", "p-2/sleep"]);
  });
});
