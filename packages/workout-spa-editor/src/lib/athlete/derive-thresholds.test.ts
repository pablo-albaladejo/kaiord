import { describe, expect, it } from "vitest";

import { deriveThresholdMetrics } from "./derive-thresholds";
import { profileWith } from "./test-profile";

const FTP = 265;
const LTHR = 168;
const MAX_HR = 189;
const SWIM_CSS_PACE = 98;
const SWIM_LTHR = 160;
const CYCLING_METRIC_COUNT = 3;
const SWIM_METRIC_COUNT = 2;

describe("deriveThresholdMetrics", () => {
  it("should derive FTP, threshold HR and max HR for cycling", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP, lthr: LTHR }, MAX_HR);

    // Act
    const metrics = deriveThresholdMetrics(profile, "cycling");

    // Assert
    expect(metrics).toHaveLength(CYCLING_METRIC_COUNT);
    expect(metrics[0]).toEqual({
      value: "265",
      unit: "W",
      label: "FTP",
      accent: true,
    });
    expect(metrics[1]).toMatchObject({ label: "Threshold HR", accent: false });
    expect(metrics[2]).toMatchObject({ value: "189", label: "Max HR" });
  });

  it("should derive CSS pace and threshold HR for swimming (no max HR row)", () => {
    // Arrange
    const profile = profileWith("swimming", {
      thresholdPace: SWIM_CSS_PACE,
      paceUnit: "min_per_100m",
      lthr: SWIM_LTHR,
    });

    // Act
    const metrics = deriveThresholdMetrics(profile, "swimming");

    // Assert
    expect(metrics).toHaveLength(SWIM_METRIC_COUNT);
    expect(metrics[0]).toEqual({
      value: "1:38",
      unit: "/100m",
      label: "CSS pace",
      accent: true,
    });
  });

  it("should omit unset metrics and accent the first present one", () => {
    // Arrange
    const profile = profileWith("cycling", { lthr: LTHR });

    // Act
    const metrics = deriveThresholdMetrics(profile, "cycling");

    // Assert
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({ label: "Threshold HR", accent: true });
  });
});
