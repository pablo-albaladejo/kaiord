/* eslint-disable no-magic-numbers -- unit-conversion fixtures use literal kg/cm/lb values for clarity */

import { describe, expect, it } from "vitest";

import {
  heightFromDisplay,
  heightToDisplay,
  heightUnitLabel,
  weightFromDisplay,
  weightToDisplay,
} from "./body-measures";

describe("body measures", () => {
  it("should leave weight and height untouched in metric", () => {
    // Arrange
    const kg = 72.5;
    const cm = 178;

    // Act
    const shown = [
      weightToDisplay(kg, "metric"),
      heightToDisplay(cm, "metric"),
    ];

    // Assert
    expect(shown).toEqual([72.5, 178]);
    expect(heightUnitLabel("metric")).toBe("cm");
  });

  it("should show weight in pounds and height in inches in imperial", () => {
    // Arrange
    const kg = 70;
    const cm = 175;

    // Act
    const weight = weightToDisplay(kg, "imperial");
    const height = heightToDisplay(cm, "imperial");

    // Assert
    expect(weight).toBe(154.3);
    expect(height).toBe(68.9);
    expect(heightUnitLabel("imperial")).toBe("in");
  });

  it("should convert a typed imperial value back to the stored metric unit", () => {
    // Arrange
    const pounds = 154.3;
    const inches = 68.9;

    // Act
    const kg = weightFromDisplay(pounds, "imperial");
    const cm = heightFromDisplay(inches, "imperial");

    // Assert
    expect(kg).toBeCloseTo(70, 1);
    expect(cm).toBeCloseTo(175, 0);
  });

  it("should keep undefined as undefined in both directions", () => {
    // Arrange
    const missing = undefined;

    // Act
    const shown = weightToDisplay(missing, "imperial");
    const stored = heightFromDisplay(missing, "imperial");

    // Assert
    expect(shown).toBeUndefined();
    expect(stored).toBeUndefined();
  });
});
