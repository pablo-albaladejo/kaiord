import { describe, expect, it } from "vitest";

import { labParameterLabel } from "./lab-parameter-label";

describe("labParameterLabel", () => {
  it("should render a core parameter as its Spanish name with abbreviation", () => {
    // Arrange
    const key = "hdl";

    // Act
    const label = labParameterLabel(key);

    // Assert
    expect(label).toBe("HDL colesterol (HDL)");
  });

  it("should de-slug a free custom parameter key", () => {
    // Arrange
    const key = "custom:apo-e-genotipo";

    // Act
    const label = labParameterLabel(key);

    // Assert
    expect(label).toBe("apo e genotipo");
  });

  it("should fall back to the raw key for an unknown core key", () => {
    // Arrange
    const key = "not_a_real_parameter";

    // Act
    const label = labParameterLabel(key);

    // Assert
    expect(label).toBe("not_a_real_parameter");
  });
});
