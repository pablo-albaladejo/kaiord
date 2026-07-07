import { getLabParameter } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { resolveCatalogRefRange } from "./resolve-catalog-ref-range";

describe("resolveCatalogRefRange", () => {
  it("should return the sex-specific range when refBySex and sex are present", () => {
    // Arrange
    const creatinine = getLabParameter("creatinine")!;

    // Act
    const male = resolveCatalogRefRange(creatinine, "male");
    const female = resolveCatalogRefRange(creatinine, "female");

    // Assert
    expect(male).toEqual({ low: 0.7, high: 1.3 });
    expect(female).toEqual({ low: 0.6, high: 1.1 });
  });

  it("should fall back to the non-sex range when sex is undefined", () => {
    // Arrange
    const glucose = getLabParameter("glucose")!;

    // Act
    const range = resolveCatalogRefRange(glucose, undefined);

    // Assert
    expect(range).toEqual({ low: 70, high: 99 });
  });

  it("should fall back to the non-sex range when the parameter has no refBySex", () => {
    // Arrange
    const glucose = getLabParameter("glucose")!;

    // Act
    const range = resolveCatalogRefRange(glucose, "female");

    // Assert
    expect(range).toEqual({ low: 70, high: 99 });
  });

  it("should return undefined when the parameter carries no canonical range", () => {
    // Arrange
    const tsh = getLabParameter("tsh")!;
    const noRange = {
      ...tsh,
      canonicalRefLow: undefined,
      canonicalRefHigh: undefined,
    };

    // Act
    const range = resolveCatalogRefRange(noRange, undefined);

    // Assert
    expect(range).toBeUndefined();
  });
});
