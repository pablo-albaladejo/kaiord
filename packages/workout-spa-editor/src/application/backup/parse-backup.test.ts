import { describe, expect, it } from "vitest";

import { BackupFileError, parseBackup } from "./parse-backup";

const valid = {
  format: "kaiord-backup",
  version: 1,
  manifest: {
    schemaVersion: 40,
    deviceId: "dev-a",
    exportedAt: "2026-10-10T08:00:00.000Z",
    encrypted: false,
  },
  tables: { workouts: [{ id: "w-1", profileId: "p-1" }] },
  tombstones: [
    { table: "workouts", id: "w-0", deletedAt: "2026-10-01T00:00:00.000Z" },
  ],
  nutrition: {
    intakeEntries: [
      {
        id: "i-1",
        profileId: "p-1",
        date: "2026-10-10",
        loggedAt: "2026-10-10T08:00:00.000Z",
        kcal: 500,
        proteinG: 30,
        carbG: 50,
        fatG: 15,
      },
    ],
    intakePresets: [],
    energyTargets: [],
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
    const text = JSON.stringify({ ...valid, version: 2 });

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
    const entry = { ...valid.nutrition.intakeEntries[0], kcal: -5 };
    const nutrition = { ...valid.nutrition, intakeEntries: [entry] };
    const text = JSON.stringify({ ...valid, nutrition });

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
