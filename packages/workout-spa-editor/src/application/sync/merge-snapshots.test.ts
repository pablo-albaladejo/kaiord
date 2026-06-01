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

  it("should keep the usage row from the later manifest exportedAt", () => {
    // Arrange
    const winningCount = 9;
    const local = snap("2026-05-01T00:00:00Z", {
      usage: [{ yearMonth: "2026-05", count: 1 }],
    });
    const remote = snap("2026-05-30T00:00:00Z", {
      usage: [{ yearMonth: "2026-05", count: winningCount }],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(rows("usage", merged)[0].count).toBe(winningCount);
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
