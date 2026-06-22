import { describe, expect, it } from "vitest";

import { DEFAULT_MET, MET_TABLE, metForSport } from "./met-table";

const RUNNING_MET = 9.8;
const CYCLING_MET = 8.0;
const SWIMMING_MET = 7.0;
const EXPECTED_DEFAULT_MET = 6.0;

describe("metForSport", () => {
  it("should return the curated MET for a mapped endurance sport", () => {
    // Arrange
    const sport = "running" as const;

    // Act
    const met = metForSport(sport);

    // Assert
    expect(met).toBe(RUNNING_MET);
  });

  it("should return the curated MET for cycling", () => {
    // Arrange
    const sport = "cycling" as const;

    // Act
    const met = metForSport(sport);

    // Assert
    expect(met).toBe(CYCLING_MET);
  });

  it("should return the curated MET for swimming", () => {
    // Arrange
    const sport = "swimming" as const;

    // Act
    const met = metForSport(sport);

    // Assert
    expect(met).toBe(SWIMMING_MET);
  });

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

  it("should document a moderate-effort DEFAULT_MET", () => {
    // Arrange
    const expected = EXPECTED_DEFAULT_MET;

    // Act
    const actual = DEFAULT_MET;

    // Assert
    expect(actual).toBe(expected);
  });
});
