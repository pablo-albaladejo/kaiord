import { describe, expect, it } from "vitest";

import { fitTimestampToIso, isoToFitTimestampSeconds } from "./fit-timestamp";

const SECONDS_TO_MILLIS = 1000;

describe("fitTimestampToIso", () => {
  it("should serialize a Date directly to ISO", () => {
    // Arrange
    const value = new Date("2024-01-02T03:04:05.000Z");

    // Act
    const result = fitTimestampToIso(value);

    // Assert
    expect(result).toBe("2024-01-02T03:04:05.000Z");
  });

  it("should treat a number as FIT epoch seconds scaled by 1000", () => {
    // Arrange
    const epochSeconds = 1_704_164_645;

    // Act
    const result = fitTimestampToIso(epochSeconds);

    // Assert
    expect(result).toBe(
      new Date(epochSeconds * SECONDS_TO_MILLIS).toISOString()
    );
  });

  it("should parse a string timestamp via Date", () => {
    // Arrange
    const value = "2024-01-02T03:04:05.000Z";

    // Act
    const result = fitTimestampToIso(value);

    // Assert
    expect(result).toBe("2024-01-02T03:04:05.000Z");
  });
});

describe("isoToFitTimestampSeconds", () => {
  it("should convert an ISO string back to floored FIT epoch seconds", () => {
    // Arrange
    const iso = "2024-01-02T03:04:05.999Z";

    // Act
    const result = isoToFitTimestampSeconds(iso);

    // Assert
    expect(result).toBe(
      Math.floor(new Date(iso).getTime() / SECONDS_TO_MILLIS)
    );
  });

  it("should round-trip a number timestamp through ISO and back", () => {
    // Arrange
    const epochSeconds = 1_704_164_645;

    // Act
    const result = isoToFitTimestampSeconds(fitTimestampToIso(epochSeconds));

    // Assert
    expect(result).toBe(epochSeconds);
  });
});
