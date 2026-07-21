import { describe, expect, it } from "vitest";

import { tanitaMeasurementSchema } from "./tanita-measurement.schema";

const RAW_ROW = {
  measuredAt: "2021-01-28 08:04:11",
  weightKilograms: "80.00",
  bmi: "-",
  bodyFatPercent: "18.00",
  visceralFatRating: "-",
  leanMassKilograms: "60.00",
  boneMassKilograms: "3.20",
  basalMetabolicRateKcal: "1800.00",
  bodyWaterPercent: "55.00",
};

const EXPECTED_ISO = "2021-01-28T08:04:11.000Z";
const EXPECTED_WEIGHT_KG = 80;
const EXPECTED_BONE_MASS_KG = 3.2;

describe("tanitaMeasurementSchema", () => {
  it("should anchor the naive MyTANITA datetime to UTC as ISO 8601", () => {
    // Arrange
    const input = RAW_ROW;

    // Act
    const result = tanitaMeasurementSchema.parse(input);

    // Assert
    expect(result.measuredAt).toBe(EXPECTED_ISO);
  });

  it("should coerce numeric cells to numbers", () => {
    // Arrange
    const input = RAW_ROW;

    // Act
    const result = tanitaMeasurementSchema.parse(input);

    // Assert
    expect(result.weightKilograms).toBe(EXPECTED_WEIGHT_KG);
    expect(result.boneMassKilograms).toBe(EXPECTED_BONE_MASS_KG);
  });

  it("should map a missing dash cell to undefined rather than zero", () => {
    // Arrange
    const input = RAW_ROW;

    // Act
    const result = tanitaMeasurementSchema.parse(input);

    // Assert
    expect(result.bmi).toBeUndefined();
    expect(result.visceralFatRating).toBeUndefined();
  });

  it("should reject a row whose datetime is malformed", () => {
    // Arrange
    const input = { ...RAW_ROW, measuredAt: "28/01/2021" };

    // Act
    const result = tanitaMeasurementSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
