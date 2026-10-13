import { describe, expect, it } from "vitest";

import { formatFieldValue } from "./field-labels";

const LTHR = 165;
const BAND_MIN = 120;
const FTP = 250;

describe("formatFieldValue heart-rate unit", () => {
  it.each(["cycling.thresholds.lthr", "heartRate.max"] as const)(
    "should show the given unit for %s",
    (field) => {
      // Arrange
      const unit = "ppm";

      // Act
      const text = formatFieldValue(field, LTHR, unit);

      // Assert
      expect(text).toBe(`${LTHR} ppm`);
    }
  );

  it("should show the unit for a heart-rate band", () => {
    // Arrange
    const field = "running.heartRateZones.z1.minBpm";

    // Act
    const text = formatFieldValue(field, BAND_MIN, "ppm");

    // Assert
    expect(text).toBe(`${BAND_MIN} ppm`);
  });

  it("should leave other units alone", () => {
    // Arrange
    const field = "cycling.thresholds.ftp";

    // Act
    const text = formatFieldValue(field, FTP, "ppm");

    // Assert
    expect(text).toBe(`${FTP} W`);
  });
});
