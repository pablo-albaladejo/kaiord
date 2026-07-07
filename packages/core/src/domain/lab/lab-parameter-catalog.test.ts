import { describe, expect, it } from "vitest";

import { labParameterSchema } from "./lab-parameter";
import {
  customParameterKey,
  getLabParameter,
  isCustomParameterKey,
  LAB_PARAMETER_CATALOG,
} from "./lab-parameter-catalog";

const DIFFERENTIAL_CELLS = [
  "neutrophils",
  "lymphocytes",
  "monocytes",
  "eosinophils",
  "basophils",
];

const EXPECTED_CORE_COUNT = 56;
const MIN_CORE_COUNT = 50;
const MAX_CORE_COUNT = 60;
const HBA1C_FACTOR = 0.0915;
const HBA1C_OFFSET = 2.15;
const VITAMIN_D_FACTOR = 0.4;
const FACTOR_PRECISION = 4;

describe("LAB_PARAMETER_CATALOG", () => {
  it("should hold the closed core of ~55 parameters", () => {
    // Arrange
    const count = LAB_PARAMETER_CATALOG.length;

    // Act
    const withinExpectedCore =
      count >= MIN_CORE_COUNT && count <= MAX_CORE_COUNT;

    // Assert
    expect(count).toBe(EXPECTED_CORE_COUNT);
    expect(withinExpectedCore).toBe(true);
  });

  it("should have no duplicate keys", () => {
    // Arrange
    const keys = LAB_PARAMETER_CATALOG.map((parameter) => parameter.key);

    // Act
    const unique = new Set(keys);

    // Assert
    expect(unique.size).toBe(keys.length);
  });

  it("should give every parameter a canonical unit", () => {
    // Arrange
    const units = LAB_PARAMETER_CATALOG.map((p) => p.canonicalUnit);

    // Act
    const allPresent = units.every((unit) => unit.length > 0);

    // Assert
    expect(allPresent).toBe(true);
  });

  it("should validate every entry against the parameter schema", () => {
    // Arrange
    const results = LAB_PARAMETER_CATALOG.map((parameter) =>
      labParameterSchema.safeParse(parameter)
    );

    // Act
    const failures = results.filter((result) => !result.success);

    // Assert
    expect(failures).toEqual([]);
  });

  it("should split each differential cell into separate _pct and _abs keys", () => {
    // Arrange
    const keys = new Set(LAB_PARAMETER_CATALOG.map((p) => p.key));

    // Act
    const allSplit = DIFFERENTIAL_CELLS.every(
      (cell) => keys.has(`${cell}_pct`) && keys.has(`${cell}_abs`)
    );

    // Assert
    expect(allSplit).toBe(true);
  });

  it("should model HbA1c mmol/mol as an affine unit with a non-zero offset", () => {
    // Arrange
    const hba1c = getLabParameter("hba1c");

    // Act
    const mmolPerMol = hba1c?.knownUnits?.find((u) => u.unit === "mmol/mol");

    // Assert
    expect(hba1c?.canonicalUnit).toBe("%");
    expect(mmolPerMol?.factorToCanonical).toBeCloseTo(
      HBA1C_FACTOR,
      FACTOR_PRECISION
    );
    expect(mmolPerMol?.offsetToCanonical).toBeCloseTo(
      HBA1C_OFFSET,
      FACTOR_PRECISION
    );
  });

  it("should model Vitamin D nmol/L as a pure factor of 0.4", () => {
    // Arrange
    const vitaminD = getLabParameter("vitamin_d");

    // Act
    const nmol = vitaminD?.knownUnits?.find((u) => u.unit === "nmol/L");

    // Assert
    expect(vitaminD?.canonicalUnit).toBe("ng/mL");
    expect(nmol?.factorToCanonical).toBe(VITAMIN_D_FACTOR);
    expect(nmol?.offsetToCanonical).toBeUndefined();
  });
});

describe("getLabParameter", () => {
  it("should return undefined for an unknown key", () => {
    // Arrange
    const key = "not-a-real-parameter";

    // Act
    const parameter = getLabParameter(key);

    // Assert
    expect(parameter).toBeUndefined();
  });
});

describe("custom parameter keys", () => {
  it("should build and recognize a free custom key", () => {
    // Arrange
    const key = customParameterKey("homocysteine");

    // Act
    const recognized = isCustomParameterKey(key);

    // Assert
    expect(key).toBe("custom:homocysteine");
    expect(recognized).toBe(true);
  });

  it("should not treat a core key as custom", () => {
    // Arrange
    const key = "glucose";

    // Act
    const recognized = isCustomParameterKey(key);

    // Assert
    expect(recognized).toBe(false);
  });
});
