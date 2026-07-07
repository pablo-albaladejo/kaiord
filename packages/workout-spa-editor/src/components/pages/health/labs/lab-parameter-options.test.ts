import { describe, expect, it } from "vitest";

import {
  findParameterByLabel,
  LAB_PARAMETER_OPTIONS,
  slugify,
  unitOptionsFor,
} from "./lab-parameter-options";

describe("LAB_PARAMETER_OPTIONS", () => {
  it("should build a nameES (abbrev) label per catalog option, sorted by name", () => {
    // Arrange

    // Act
    const labels = LAB_PARAMETER_OPTIONS.map((o) => o.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b));

    // Assert
    expect(labels).toEqual(sorted);
    expect(labels).toContain("Glucosa (ayunas) (GLU)");
  });
});

describe("findParameterByLabel", () => {
  it("should resolve an exact catalog label back to its parameter", () => {
    // Arrange
    const label = "Glucosa (ayunas) (GLU)";

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
    const hba1c = findParameterByLabel("Hemoglobina glicada (HbA1c)")!;

    // Act
    const units = unitOptionsFor(hba1c);

    // Assert
    expect(units).toEqual(["%", "mmol/mol"]);
  });
});

describe("slugify", () => {
  it("should lowercase, strip accents, and dasherize a free-text name", () => {
    // Arrange
    const name = "  Apo-E (Genotipo) ";

    // Act
    const slug = slugify(name);

    // Assert
    expect(slug).toBe("apo-e-genotipo");
  });
});
