import { describe, expect, it } from "vitest";

import { profileWith } from "./test-profile";
import { thresholdsForSport } from "./threshold-for-sport";

const FTP = 250;

describe("thresholdsForSport", () => {
  it("should return the sport's thresholds when present", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP });

    // Act
    const result = thresholdsForSport(profile, "cycling");

    // Assert
    expect(result).toEqual({ ftp: FTP });
  });

  it("should return an empty object for a sport with no config", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP });

    // Act
    const result = thresholdsForSport(profile, "running");

    // Assert
    expect(result).toEqual({});
  });

  it("should return an empty object when the profile is null", () => {
    // Arrange

    // Act
    const result = thresholdsForSport(null, "cycling");

    // Assert
    expect(result).toEqual({});
  });
});
