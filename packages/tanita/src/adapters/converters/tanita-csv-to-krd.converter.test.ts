import { krdSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { TANITA_CSV_FIXTURE } from "../../test-utils/tanita-fixture";
import { tanitaCsvToKrd } from "./tanita-csv-to-krd.converter";

const HEALTH_VERSION = "2.0";
const EXPECTED_DOCUMENT_COUNT = 3;

const FULL_MEASURED_AT = "2021-01-28T08:04:11.000Z";
const FULL_WEIGHT_KG = 80;
const FULL_BMI = 26;
const FULL_BODY_FAT_PERCENT = 18;
const FULL_VISCERAL_FAT = 7;
const FULL_LEAN_MASS_KG = 60;
const FULL_BONE_MASS_KG = 3.2;
const FULL_BMR_KCAL = 1800;
const FULL_BODY_WATER_PERCENT = 55;

const PARTIAL_WEIGHT_KG = 81.5;
const PARTIAL_BODY_FAT_PERCENT = 20;
const PARTIAL_BMR_KCAL = 1750;

const WEIGHT_ONLY_KG = 79.25;

const EXPECTED_FULL_WEIGHT = {
  kind: "weight",
  version: HEALTH_VERSION,
  measuredAt: FULL_MEASURED_AT,
  weightKilograms: FULL_WEIGHT_KG,
};

const EXPECTED_FULL_COMPOSITION = {
  kind: "bodyComposition",
  version: HEALTH_VERSION,
  measuredAt: FULL_MEASURED_AT,
  bmi: FULL_BMI,
  bodyFatPercent: FULL_BODY_FAT_PERCENT,
  visceralFatRating: FULL_VISCERAL_FAT,
  leanMassKilograms: FULL_LEAN_MASS_KG,
  boneMassKilograms: FULL_BONE_MASS_KG,
  basalMetabolicRateKcal: FULL_BMR_KCAL,
  bodyWaterPercent: FULL_BODY_WATER_PERCENT,
};

const EXPECTED_PARTIAL_COMPOSITION = {
  kind: "bodyComposition",
  version: HEALTH_VERSION,
  measuredAt: "2021-02-15T07:30:00.000Z",
  bodyFatPercent: PARTIAL_BODY_FAT_PERCENT,
  basalMetabolicRateKcal: PARTIAL_BMR_KCAL,
};

const documents = tanitaCsvToKrd(TANITA_CSV_FIXTURE);
const [full, partial, weightOnly] = documents;

describe("tanitaCsvToKrd", () => {
  it("should emit one KRD document per measurement row", () => {
    // Arrange
    const csv = TANITA_CSV_FIXTURE;

    // Act
    const result = tanitaCsvToKrd(csv);

    // Assert
    expect(result).toHaveLength(EXPECTED_DOCUMENT_COUNT);
  });

  it("should map the weight and full body composition of a complete row", () => {
    // Arrange
    const document = full;

    // Act
    const health = document?.extensions?.health;

    // Assert
    expect(document?.type).toBe("body_composition");
    expect(health?.weight).toEqual(EXPECTED_FULL_WEIGHT);
    expect(health?.bodyComposition).toEqual(EXPECTED_FULL_COMPOSITION);
  });

  it("should anchor the row datetime to a UTC ISO instant", () => {
    // Arrange
    const document = full;

    // Act
    const measuredAt = document?.extensions?.health?.weight?.measuredAt;

    // Assert
    expect(measuredAt).toBe(FULL_MEASURED_AT);
  });

  it("should treat dash cells as absent and read a quoted weight field", () => {
    // Arrange
    const document = partial;

    // Act
    const health = document?.extensions?.health;

    // Assert
    expect(health?.weight?.weightKilograms).toBe(PARTIAL_WEIGHT_KG);
    expect(health?.bodyComposition).toEqual(EXPECTED_PARTIAL_COMPOSITION);
    expect(health?.bodyComposition?.bmi).toBeUndefined();
  });

  it("should drop body composition when every composition column is missing", () => {
    // Arrange
    const document = weightOnly;

    // Act
    const health = document?.extensions?.health;

    // Assert
    expect(document?.type).toBe("weight_measurement");
    expect(health?.weight?.weightKilograms).toBe(WEIGHT_ONLY_KG);
    expect(health?.bodyComposition).toBeUndefined();
  });

  it("should ignore deferred columns that have no KRD home", () => {
    // Arrange
    const composition = full?.extensions?.health?.bodyComposition ?? {};

    // Act
    const keys = Object.keys(composition).sort();

    // Assert
    expect(keys).toEqual(Object.keys(EXPECTED_FULL_COMPOSITION).sort());
  });

  it("should produce documents that validate against the KRD schema", () => {
    // Arrange
    const candidates = documents;

    // Act
    const allValid = candidates.every(
      (document) => krdSchema.safeParse(document).success
    );

    // Assert
    expect(allValid).toBe(true);
  });
});
