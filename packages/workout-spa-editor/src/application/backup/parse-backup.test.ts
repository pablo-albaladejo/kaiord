import { describe, expect, it } from "vitest";

import { BackupFileError, parseBackup } from "./parse-backup";

const MANIFEST = {
  schemaVersion: 40,
  deviceId: "dev-a",
  exportedAt: "2026-10-10T08:00:00.000Z",
  encrypted: false,
};

const ENTRY = {
  id: "i-1",
  profileId: "p-1",
  date: "2026-10-10",
  loggedAt: "2026-10-10T08:00:00.000Z",
  updatedAt: "2026-10-10T09:00:00.000Z",
  kcal: 500,
  proteinG: 30,
  carbG: 50,
  fatG: 15,
};

const valid = {
  format: "kaiord-backup",
  version: 2,
  manifest: MANIFEST,
  tables: {
    workouts: [{ id: "w-1", profileId: "p-1" }],
    intakeEntries: [ENTRY],
  },
  tombstones: [
    { table: "workouts", id: "w-0", deletedAt: "2026-10-01T00:00:00.000Z" },
  ],
};

const legacyEntry: Record<string, unknown> = { ...ENTRY };
delete legacyEntry.updatedAt;
const legacyPreset = {
  id: "pre-1",
  profileId: "p-1",
  label: "Oats",
  kcal: 350,
  proteinG: 12,
  carbG: 55,
  fatG: 7,
  createdAt: "2026-10-01T08:00:00.000Z",
};
const target = {
  profileId: "p-1",
  goalType: "maintain",
  startWeightKg: 70,
  targetWeightKg: 70,
  targetDate: "2026-12-31",
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-02T08:00:00.000Z",
};

/** A file exported before nutrition rode the snapshot. */
const legacy = {
  format: "kaiord-backup",
  version: 1,
  manifest: MANIFEST,
  tables: { workouts: [{ id: "w-1", profileId: "p-1" }] },
  tombstones: [],
  nutrition: {
    intakeEntries: [legacyEntry],
    intakePresets: [legacyPreset],
    energyTargets: [target],
  },
};

const reasonOf = (text: string): string | undefined => {
  try {
    parseBackup(text);
    return undefined;
  } catch (error) {
    return error instanceof BackupFileError ? error.reason : "other";
  }
};

describe("parseBackup", () => {
  it("should return the backup of a valid file", () => {
    // Arrange
    const text = JSON.stringify(valid);

    // Act
    const backup = parseBackup(text);

    // Assert
    expect(backup).toEqual(valid);
  });

  it("should reject text that is not JSON as an invalid file", () => {
    // Arrange
    const text = "not json {";

    // Act
    const reason = reasonOf(text);

    // Assert
    expect(reason).toBe("invalid");
  });

  it("should reject a JSON file of another format as an invalid file", () => {
    // Arrange
    const text = JSON.stringify({ ...valid, format: "something-else" });

    // Act
    const reason = reasonOf(text);

    // Assert
    expect(reason).toBe("invalid");
  });

  it("should reject a backup version this app does not know", () => {
    // Arrange
    const text = JSON.stringify({ ...valid, version: 3 });

    // Act
    const reason = reasonOf(text);

    // Assert
    expect(reason).toBe("unsupportedVersion");
  });

  it("should reject a file whose tables are not lists of records", () => {
    // Arrange
    const text = JSON.stringify({ ...valid, tables: { workouts: "w-1" } });

    // Act
    const reason = reasonOf(text);

    // Assert
    expect(reason).toBe("invalid");
  });

  it("should reject a file with a malformed intake entry", () => {
    // Arrange
    const tables = { ...valid.tables, intakeEntries: [{ ...ENTRY, kcal: -5 }] };
    const text = JSON.stringify({ ...valid, tables });

    // Act
    const reason = reasonOf(text);

    // Assert
    expect(reason).toBe("invalid");
  });

  it("should fold a version 1 file's nutrition into its tables with a backfilled clock", () => {
    // Arrange
    const text = JSON.stringify(legacy);

    // Act
    const backup = parseBackup(text);

    // Assert
    expect(backup).toEqual({
      format: "kaiord-backup",
      version: 2,
      manifest: MANIFEST,
      tables: {
        workouts: legacy.tables.workouts,
        intakeEntries: [{ ...legacyEntry, updatedAt: legacyEntry.loggedAt }],
        intakePresets: [{ ...legacyPreset, updatedAt: legacyPreset.createdAt }],
        energyTargets: [target],
      },
      tombstones: [],
    });
  });

  it("should reject a version 1 file with a malformed intake entry", () => {
    // Arrange
    const nutrition = {
      ...legacy.nutrition,
      intakeEntries: [{ ...legacyEntry, kcal: -5 }],
    };
    const text = JSON.stringify({ ...legacy, nutrition });

    // Act
    const reason = reasonOf(text);

    // Assert
    expect(reason).toBe("invalid");
  });

  it("should reject an encrypted manifest, which a backup never has", () => {
    // Arrange
    const manifest = { ...valid.manifest, encrypted: true };
    const text = JSON.stringify({ ...valid, manifest });

    // Act
    const reason = reasonOf(text);

    // Assert
    expect(reason).toBe("invalid");
  });
});
