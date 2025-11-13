import { describe, expect, it } from "vitest";
import { mapSubSportToFit, mapSubSportToKrd } from "./sub-sport.mapper";

describe("mapSubSportToKrd", () => {
  it("should map valid FIT sub-sport to KRD", () => {
    // Arrange & Act
    const result = mapSubSportToKrd("indoorCycling");

    // Assert
    expect(result).toBe("indoor_cycling");
  });

  it("should map 1:1 FIT sub-sport to KRD", () => {
    // Arrange & Act
    const result = mapSubSportToKrd("generic");

    // Assert
    expect(result).toBe("generic");
  });

  it("should return generic for invalid FIT sub-sport", () => {
    // Arrange & Act
    const result = mapSubSportToKrd("invalid");

    // Assert
    expect(result).toBe("generic");
  });

  it("should handle null gracefully", () => {
    // Arrange & Act
    const result = mapSubSportToKrd(null);

    // Assert
    expect(result).toBe("generic");
  });

  it("should handle undefined gracefully", () => {
    // Arrange & Act
    const result = mapSubSportToKrd(undefined);

    // Assert
    expect(result).toBe("generic");
  });

  it("should handle number gracefully", () => {
    // Arrange & Act
    const result = mapSubSportToKrd(123);

    // Assert
    expect(result).toBe("generic");
  });
});

describe("mapSubSportToFit", () => {
  it("should map valid KRD sub-sport to FIT", () => {
    // Arrange & Act
    const result = mapSubSportToFit("indoor_cycling");

    // Assert
    expect(result).toBe("indoorCycling");
  });

  it("should map 1:1 KRD sub-sport to FIT", () => {
    // Arrange & Act
    const result = mapSubSportToFit("generic");

    // Assert
    expect(result).toBe("generic");
  });

  it("should return generic for invalid KRD sub-sport", () => {
    // Arrange & Act
    const result = mapSubSportToFit("invalid");

    // Assert
    expect(result).toBe("generic");
  });

  it("should handle null gracefully", () => {
    // Arrange & Act
    const result = mapSubSportToFit(null);

    // Assert
    expect(result).toBe("generic");
  });

  it("should handle undefined gracefully", () => {
    // Arrange & Act
    const result = mapSubSportToFit(undefined);

    // Assert
    expect(result).toBe("generic");
  });

  it("should handle number gracefully", () => {
    // Arrange & Act
    const result = mapSubSportToFit(123);

    // Assert
    expect(result).toBe("generic");
  });
});

describe("round-trip conversion", () => {
  it("should preserve sub-sport through FIT -> KRD -> FIT", () => {
    // Arrange
    const fitSubSport = "indoorCycling";

    // Act
    const krdSubSport = mapSubSportToKrd(fitSubSport);
    const roundTripped = mapSubSportToFit(krdSubSport);

    // Assert
    expect(roundTripped).toBe(fitSubSport);
  });

  it("should preserve sub-sport through KRD -> FIT -> KRD", () => {
    // Arrange
    const krdSubSport = "indoor_cycling";

    // Act
    const fitSubSport = mapSubSportToFit(krdSubSport);
    const roundTripped = mapSubSportToKrd(fitSubSport);

    // Assert
    expect(roundTripped).toBe(krdSubSport);
  });

  it("should preserve 1:1 sub-sport through round-trip", () => {
    // Arrange
    const subSport = "generic";

    // Act
    const fitSubSport = mapSubSportToFit(subSport);
    const roundTripped = mapSubSportToKrd(fitSubSport);

    // Assert
    expect(roundTripped).toBe(subSport);
  });
});
