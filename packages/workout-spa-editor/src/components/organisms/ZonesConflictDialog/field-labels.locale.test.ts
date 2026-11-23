import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { getTranslate } from "../../../i18n/use-translate";
import { fieldLabel, formatFieldValue } from "./field-labels";

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

describe("fieldLabel in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name a threshold and a band in Spanish", () => {
    // Arrange
    const t = getTranslate("zones", "es");

    // Act
    const labels = [
      fieldLabel("running.thresholds.lthr", t),
      fieldLabel("cycling.heartRateZones.z2.maxBpm", t),
    ];

    // Assert
    expect(labels).toEqual(["LTHR de carrera", "FC Z2 máx. (ciclismo)"]);
  });

  it("should keep the English names by default", () => {
    // Arrange
    const fields = ["bodyWeight", "running.paceZones.z1.minPace"] as const;

    // Act
    const labels = fields.map((field) => fieldLabel(field));

    // Assert
    expect(labels).toEqual(["Body weight", "Running Pace Z1 min"]);
  });
});
