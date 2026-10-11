import { describe, expect, it } from "vitest";

import { mergePostExportWrites } from "./live-post-export-merge";
import { tombstoneKey } from "./merge-tombstones";

const row = (id: string, updatedAt: string, profileId = "p-1") => ({
  id,
  profileId,
  updatedAt,
});

const EXPORTED = [row("a", "2026-10-10T00:00:00Z")];

describe("mergePostExportWrites", () => {
  it("should replace a live row unchanged since the export by the incoming rows", () => {
    // Arrange
    const merge = mergePostExportWrites("intakeEntries", EXPORTED, new Map());
    const rekeyed = { ...EXPORTED[0], profileId: "p-2" };

    // Act
    const result = merge(EXPORTED, [rekeyed]);

    // Assert
    expect(result).toEqual([rekeyed]);
  });

  it("should drop a live row unchanged since the export that the incoming rows left out", () => {
    // Arrange
    const merge = mergePostExportWrites("intakeEntries", EXPORTED, new Map());

    // Act
    const result = merge(EXPORTED, []);

    // Assert
    expect(result).toEqual([]);
  });

  it("should keep a row written after the export", () => {
    // Arrange
    const merge = mergePostExportWrites("intakeEntries", EXPORTED, new Map());
    const written = row("b", "2026-10-11T00:00:00Z");

    // Act
    const result = merge([...EXPORTED, written], EXPORTED);

    // Assert
    expect(result).toEqual([...EXPORTED, written]);
  });

  it("should let a newer incoming copy beat a row edited after the export", () => {
    // Arrange
    const merge = mergePostExportWrites("intakeEntries", EXPORTED, new Map());
    const edited = row("a", "2026-10-11T00:00:00Z");
    const newer = row("a", "2026-10-12T00:00:00Z");

    // Act
    const result = merge([edited], [newer]);

    // Assert
    expect(result).toEqual([newer]);
  });

  it("should drop a row written after the export that a newer tombstone deletes", () => {
    // Arrange
    const deletes = new Map([
      [tombstoneKey("intakeEntries", "b"), Date.parse("2026-10-12T00:00:00Z")],
    ]);
    const merge = mergePostExportWrites("intakeEntries", EXPORTED, deletes);

    // Act
    const result = merge([row("b", "2026-10-11T00:00:00Z")], []);

    // Assert
    expect(result).toEqual([]);
  });
});

describe("mergePostExportWrites — energy goal keyed by profile id", () => {
  it("should drop a goal written after the export that a newer profile-id tombstone deletes", () => {
    // Arrange
    const deletes = new Map([
      [
        tombstoneKey("energyTargets", "p-1"),
        Date.parse("2026-10-12T00:00:00Z"),
      ],
    ]);
    const merge = mergePostExportWrites("energyTargets", [], deletes);
    const goal = { profileId: "p-1", updatedAt: "2026-10-11T00:00:00Z" };

    // Act
    const result = merge([goal], []);

    // Assert
    expect(result).toEqual([]);
  });
});
