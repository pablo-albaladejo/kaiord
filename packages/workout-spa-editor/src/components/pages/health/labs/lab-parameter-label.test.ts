import { describe, expect, it } from "vitest";

import { labParameterLabel } from "./lab-parameter-label";

describe("labParameterLabel", () => {
  it.each([
    {
      scenario: "a core parameter as its English name with abbreviation",
      key: "hdl",
      expected: "HDL cholesterol (HDL)",
    },
    {
      scenario: "a de-slugged free custom parameter key",
      key: "custom:apo-e-genotype",
      expected: "apo e genotype",
    },
    {
      scenario: "the raw key for an unknown core key",
      key: "not_a_real_parameter",
      expected: "not_a_real_parameter",
    },
  ])("should render $scenario", ({ key, expected }) => {
    // Arrange

    // Act
    const label = labParameterLabel(key);

    // Assert
    expect(label).toBe(expected);
  });
});
