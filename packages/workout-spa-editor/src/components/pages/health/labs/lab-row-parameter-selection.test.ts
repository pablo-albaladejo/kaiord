import { getLabParameter } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createEmptyRow } from "./lab-row-model";
import {
  selectCatalogParameter,
  setCustomName,
} from "./lab-row-parameter-selection";

describe("selectCatalogParameter", () => {
  it("should fill the canonical unit and ref range and reset refTouched", () => {
    // Arrange
    const row = createEmptyRow("row-1");
    const glucose = getLabParameter("glucose")!;

    // Act
    const next = selectCatalogParameter(
      row,
      "Glucosa (ayunas) (GLU)",
      glucose,
      undefined
    );

    // Assert
    expect(next).toMatchObject({
      parameterKey: "glucose",
      unitRaw: "mg/dL",
      refLowRaw: "70",
      refHighRaw: "99",
      refTouched: false,
    });
  });

  it("should prefill the sex-aware catalog range when sex is provided", () => {
    // Arrange
    const row = createEmptyRow("row-1");
    const creatinine = getLabParameter("creatinine")!;

    // Act
    const next = selectCatalogParameter(
      row,
      "Creatinina (CREA)",
      creatinine,
      "female"
    );

    // Assert
    expect(next).toMatchObject({ refLowRaw: "0.6", refHighRaw: "1.1" });
  });

  it("should keep the typed label with no resolved key while still typing", () => {
    // Arrange
    const row = createEmptyRow("row-1");

    // Act
    const next = selectCatalogParameter(row, "Gluc", undefined, undefined);

    // Assert
    expect(next).toMatchObject({ catalogLabel: "Gluc", parameterKey: "" });
  });
});

describe("setCustomName", () => {
  it("should derive a custom:<slug> parameter key from the typed name", () => {
    // Arrange
    const row = createEmptyRow("row-1");

    // Act
    const next = setCustomName(row, "Apo-E Genotipo");

    // Assert
    expect(next.parameterKey).toBe("custom:apo-e-genotipo");
  });

  it("should clear the parameter key when the name is blank", () => {
    // Arrange
    const row = { ...createEmptyRow("row-1"), parameterKey: "custom:x" };

    // Act
    const next = setCustomName(row, "   ");

    // Assert
    expect(next.parameterKey).toBe("");
  });
});
