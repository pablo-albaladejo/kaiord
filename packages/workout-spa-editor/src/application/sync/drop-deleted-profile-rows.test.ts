import { describe, expect, it } from "vitest";

import type { Snapshot } from "../../types/snapshot";
import { dropDeletedProfileRows } from "./drop-deleted-profile-rows";

const PER_PROFILE = ["intakeEntries", "healthWeight"];

const snapshotWith = (
  profiles: Array<{ id: string }>,
  tombstoneIds: string[]
): Snapshot => ({
  manifest: {
    schemaVersion: 37,
    deviceId: "dev-a",
    exportedAt: "2026-10-11T00:00:00.000Z",
    encrypted: false,
  },
  tables: {
    profiles,
    intakeEntries: [
      { id: "i-gone", profileId: "p-gone" },
      { id: "i-live", profileId: "p-live" },
      { id: "i-late", profileId: "p-late" },
    ],
    healthWeight: [{ id: "hw-gone", profileId: "p-gone" }],
    workouts: [{ id: "w-gone", profileId: "p-gone" }],
  },
  tombstones: tombstoneIds.map((id) => ({
    table: "profiles",
    id,
    deletedAt: "2026-10-10T00:00:00.000Z",
  })),
});

describe("dropDeletedProfileRows", () => {
  it("should drop the per-profile rows of a tombstoned profile", () => {
    // Arrange
    const snapshot = snapshotWith([{ id: "p-live" }], ["p-gone"]);

    // Act
    const result = dropDeletedProfileRows(snapshot, PER_PROFILE);

    // Assert
    expect(result.tables.intakeEntries).toEqual([
      { id: "i-live", profileId: "p-live" },
      { id: "i-late", profileId: "p-late" },
    ]);
    expect(result.tables.healthWeight).toEqual([]);
  });

  it("should leave tables outside the per-profile list untouched", () => {
    // Arrange
    const snapshot = snapshotWith([{ id: "p-live" }], ["p-gone"]);

    // Act
    const result = dropDeletedProfileRows(snapshot, PER_PROFILE);

    // Assert
    expect(result.tables.workouts).toEqual(snapshot.tables.workouts);
  });

  it("should keep the rows of a tombstoned profile the merge kept alive", () => {
    // Arrange
    const snapshot = snapshotWith([{ id: "p-gone" }], ["p-gone"]);

    // Act
    const result = dropDeletedProfileRows(snapshot, PER_PROFILE);

    // Assert
    expect(result).toBe(snapshot);
  });

  it("should keep the rows of a profile that is absent but not tombstoned", () => {
    // Arrange
    const snapshot = snapshotWith([], []);

    // Act
    const result = dropDeletedProfileRows(snapshot, PER_PROFILE);

    // Assert
    expect(result.tables.intakeEntries).toEqual(snapshot.tables.intakeEntries);
  });
});
