import { describe, expect, it } from "vitest";

import { buildThresholdProvenance } from "./build-threshold-provenance";
import { profileWith } from "./test-profile";

describe("buildThresholdProvenance", () => {
  it("should report FTP as the cycling primary threshold", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: 268 });

    // Act
    const provenance = buildThresholdProvenance(profile, "cycling");

    // Assert
    expect(provenance).toEqual({
      metric: "ftp",
      value: "268",
      unit: "W",
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });
  });

  it("should report threshold pace as the running primary threshold", () => {
    // Arrange
    const profile = profileWith("running", {
      thresholdPace: 245,
      paceUnit: "min_per_km",
    });

    // Act
    const provenance = buildThresholdProvenance(profile, "running");

    // Assert
    expect(provenance?.metric).toBe("thresholdPace");
    expect(provenance?.unit).toBe("/km");
  });

  it("should carry the profile's own updatedAt, not a threshold timestamp", () => {
    // Arrange
    const profile = {
      ...profileWith("cycling", { ftp: 268 }),
      updatedAt: "2026-07-29T10:00:00.000Z",
    };

    // Act
    const provenance = buildThresholdProvenance(profile, "cycling");

    // Assert
    expect(provenance?.updatedAt).toEqual(new Date("2026-07-29T10:00:00.000Z"));
  });

  it("should return null when the sport has no primary threshold", () => {
    // Arrange
    const profile = profileWith("cycling", {});

    // Act
    const provenance = buildThresholdProvenance(profile, "cycling");

    // Assert
    expect(provenance).toBeNull();
  });

  it("should return null for a sport with no threshold model", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: 268 });

    // Act
    const provenance = buildThresholdProvenance(profile, "strength");

    // Assert
    expect(provenance).toBeNull();
  });

  it("should return null without a profile", () => {
    // Arrange
    const profile = null;

    // Act
    const provenance = buildThresholdProvenance(profile, "cycling");

    // Assert
    expect(provenance).toBeNull();
  });
});
