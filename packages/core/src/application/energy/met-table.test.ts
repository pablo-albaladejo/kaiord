import { describe, expect, it } from "vitest";

import { DEFAULT_MET, MET_TABLE, metForSport } from "./met-table";

const RUNNING_MET = 9.8;
const CYCLING_MET = 8.0;
const SWIMMING_MET = 7.0;

describe("metForSport", () => {
  it.each([
    ["running", RUNNING_MET],
    ["cycling", CYCLING_MET],
    ["swimming", SWIMMING_MET],
  ] as const)(
    "should return the curated MET for a mapped %s sport",
    (sport, expected) => {
      // Arrange

      // Act
      const met = metForSport(sport);

      // Assert
      expect(met).toBe(expected);
    }
  );

  it("should fall back to DEFAULT_MET for an unmapped sport", () => {
    // Arrange
    const sport = "video_gaming" as const;

    // Act
    const met = metForSport(sport);

    // Assert
    expect(met).toBe(DEFAULT_MET);
  });
});

describe("MET_TABLE", () => {
  it("should expose only positive finite MET values", () => {
    // Arrange
    const values = Object.values(MET_TABLE);

    // Act
    const allValid = values.every(
      (met) => met !== undefined && Number.isFinite(met) && met > 0
    );

    // Assert
    expect(allValid).toBe(true);
  });
});
