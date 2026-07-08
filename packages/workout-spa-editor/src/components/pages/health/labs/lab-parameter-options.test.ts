import { describe, expect, it } from "vitest";

import {
  findParameterByLabel,
  labParameterOptions,
  slugify,
  unitOptionsFor,
} from "./lab-parameter-options";

describe("labParameterOptions", () => {
  it("should build a name (abbrev) label per catalog option, sorted by name", () => {
    // Arrange

    // Act
    const labels = labParameterOptions().map((o) => o.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b));

    // Assert
    expect(labels).toEqual(sorted);
    expect(labels).toContain("Glucose (fasting) (GLU)");
  });

  it("should build Spanish labels for the es locale", () => {
    // Arrange

    // Act
    const labels = labParameterOptions("es").map((o) => o.label);

    // Assert
    expect(labels).toContain("Glucosa (ayunas) (GLU)");
  });
});

describe("findParameterByLabel", () => {
  it("should resolve an exact catalog label back to its parameter", () => {
    // Arrange
    const label = "Glucose (fasting) (GLU)";

    // Act
    const param = findParameterByLabel(label);

    // Assert
    expect(param?.key).toBe("glucose");
  });

  it("should return undefined for a label that does not match any option", () => {
    // Arrange
    const label = "not a real parameter";

    // Act
    const param = findParameterByLabel(label);

    // Assert
    expect(param).toBeUndefined();
  });
});

describe("unitOptionsFor", () => {
  it("should list the canonical unit first, then known alternates", () => {
    // Arrange
    const hba1c = findParameterByLabel("Glycated hemoglobin (HbA1c)")!;

    // Act
    const units = unitOptionsFor(hba1c);

    // Assert
    expect(units).toEqual(["%", "mmol/mol"]);
  });
});

describe("slugify", () => {
  it("should lowercase, strip accents, and dasherize a free-text name", () => {
    // Arrange
    const name = "  Apo-E (Genotype) ";

    // Act
    const slug = slugify(name);

    // Assert
    expect(slug).toBe("apo-e-genotype");
  });
});
