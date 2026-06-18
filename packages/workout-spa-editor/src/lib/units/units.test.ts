import { describe, expect, it } from "vitest";

import {
  convertKg,
  formatMinutesSeconds,
  formatPaceFromMps,
  formatWeightKg,
  paceSecondsFactor,
  paceUnitLabelFor,
  runPaceLabel,
  weightUnitLabel,
} from "./units";

const METERS_PER_KM = 1000;
const PACE_MINUTES = 4.5;
const SECONDS_PER_MINUTE = 60;
const KM_PER_MILE = 1.609344;
const YARD_PER_METER = 0.9144;
const FACTOR_PRECISION = 6;
const SAMPLE_KG = 72;
const SAMPLE_LB = 158.73;
const LB_PRECISION = 2;
const MPS_AT_4_30 = METERS_PER_KM / (PACE_MINUTES * SECONDS_PER_MINUTE);

describe("formatMinutesSeconds", () => {
  it("should format whole seconds as m:ss", () => {
    // Arrange
    const seconds = 245;

    // Act
    const result = formatMinutesSeconds(seconds);

    // Assert
    expect(result).toBe("4:05");
  });

  it("should roll 60 rounded seconds up to the next minute", () => {
    // Arrange
    const seconds = 119.6;

    // Act
    const result = formatMinutesSeconds(seconds);

    // Assert
    expect(result).toBe("2:00");
  });

  it("should return a placeholder for non-positive input", () => {
    // Arrange
    const seconds = 0;

    // Act
    const result = formatMinutesSeconds(seconds);

    // Assert
    expect(result).toBe("--:--");
  });
});

describe("formatPaceFromMps", () => {
  it("should format metric pace as min per km", () => {
    // Arrange
    const mps = MPS_AT_4_30;

    // Act
    const result = formatPaceFromMps(mps, "metric");

    // Assert
    expect(result).toBe("4:30");
  });

  it("should format imperial pace as min per mile", () => {
    // Arrange
    const mps = MPS_AT_4_30;

    // Act
    const result = formatPaceFromMps(mps, "imperial");

    // Assert
    expect(result).toBe("7:15");
  });

  it("should return a placeholder for a non-positive speed", () => {
    // Arrange
    const mps = 0;

    // Act
    const result = formatPaceFromMps(mps, "imperial");

    // Assert
    expect(result).toBe("--:--");
  });
});

describe("runPaceLabel", () => {
  it("should label metric pace as min/km", () => {
    // Arrange
    const units = "metric" as const;

    // Act
    const result = runPaceLabel(units);

    // Assert
    expect(result).toBe("min/km");
  });

  it("should label imperial pace as min/mi", () => {
    // Arrange
    const units = "imperial" as const;

    // Act
    const result = runPaceLabel(units);

    // Assert
    expect(result).toBe("min/mi");
  });
});

describe("paceSecondsFactor", () => {
  it("should leave metric pace unscaled", () => {
    // Arrange
    const base = "min_per_km" as const;

    // Act
    const result = paceSecondsFactor(base, "metric");

    // Assert
    expect(result).toBe(1);
  });

  it("should scale per-km pace to per-mile for imperial", () => {
    // Arrange
    const base = "min_per_km" as const;

    // Act
    const result = paceSecondsFactor(base, "imperial");

    // Assert
    expect(result).toBeCloseTo(KM_PER_MILE, FACTOR_PRECISION);
  });

  it("should scale per-100m pace to per-100yd for imperial", () => {
    // Arrange
    const base = "min_per_100m" as const;

    // Act
    const result = paceSecondsFactor(base, "imperial");

    // Assert
    expect(result).toBeCloseTo(YARD_PER_METER, FACTOR_PRECISION);
  });
});

describe("paceUnitLabelFor", () => {
  it("should keep metric km and 100m suffixes", () => {
    // Arrange
    const units = "metric" as const;

    // Act
    const km = paceUnitLabelFor("min_per_km", units);
    const swim = paceUnitLabelFor("min_per_100m", units);

    // Assert
    expect(km).toBe("/km");
    expect(swim).toBe("/100m");
  });

  it("should map to mile and 100yd suffixes for imperial", () => {
    // Arrange
    const units = "imperial" as const;

    // Act
    const run = paceUnitLabelFor("min_per_km", units);
    const swim = paceUnitLabelFor("min_per_100m", units);

    // Assert
    expect(run).toBe("/mi");
    expect(swim).toBe("/100yd");
  });
});

describe("weight conversion", () => {
  it("should leave kilograms unchanged for metric", () => {
    // Arrange
    const kg = SAMPLE_KG;

    // Act
    const value = convertKg(kg, "metric");
    const label = weightUnitLabel("metric");

    // Assert
    expect(value).toBe(SAMPLE_KG);
    expect(label).toBe("kg");
  });

  it("should convert kilograms to pounds for imperial", () => {
    // Arrange
    const kg = SAMPLE_KG;

    // Act
    const result = convertKg(kg, "imperial");

    // Assert
    expect(result).toBeCloseTo(SAMPLE_LB, LB_PRECISION);
  });

  it("should format weight with the active unit suffix", () => {
    // Arrange
    const kg = SAMPLE_KG;

    // Act
    const metric = formatWeightKg(kg, "metric");
    const imperial = formatWeightKg(kg, "imperial");

    // Assert
    expect(metric).toBe("72.0 kg");
    expect(imperial).toBe("158.7 lb");
  });
});
