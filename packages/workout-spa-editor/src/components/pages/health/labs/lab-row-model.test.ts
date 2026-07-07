import { describe, expect, it } from "vitest";

import {
  createEmptyRow,
  setRefHighRaw,
  setRefLowRaw,
  setRowMode,
  setUnitRaw,
  setValueRaw,
} from "./lab-row-model";

describe("lab-row-model", () => {
  it("should create a blank catalog-mode row with the given id", () => {
    // Arrange

    // Act
    const row = createEmptyRow("row-1");

    // Assert
    expect(row).toMatchObject({
      rowId: "row-1",
      mode: "catalog",
      parameterKey: "",
      refTouched: false,
    });
  });

  it("should reset identity and measurement fields when the mode changes", () => {
    // Arrange
    const row = {
      ...createEmptyRow("row-1"),
      parameterKey: "glucose",
      valueRaw: "90",
      refTouched: true,
    };

    // Act
    const next = setRowMode(row, "custom");

    // Assert
    expect(next).toMatchObject({
      rowId: "row-1",
      mode: "custom",
      parameterKey: "",
      valueRaw: "",
      refTouched: false,
    });
  });

  it("should set the value field without touching the reference range", () => {
    // Arrange
    const row = createEmptyRow("row-1");

    // Act
    const next = setValueRaw(row, "90");

    // Assert
    expect(next.valueRaw).toBe("90");
    expect(next.refTouched).toBe(false);
  });

  it("should set the unit field without marking refTouched", () => {
    // Arrange
    const row = createEmptyRow("row-1");

    // Act
    const next = setUnitRaw(row, "mg/dL");

    // Assert
    expect(next.unitRaw).toBe("mg/dL");
    expect(next.refTouched).toBe(false);
  });

  it("should mark refTouched when either reference bound is edited", () => {
    // Arrange
    const row = createEmptyRow("row-1");

    // Act
    const low = setRefLowRaw(row, "70");
    const high = setRefHighRaw(row, "99");

    // Assert
    expect(low).toMatchObject({ refLowRaw: "70", refTouched: true });
    expect(high).toMatchObject({ refHighRaw: "99", refTouched: true });
  });
});
