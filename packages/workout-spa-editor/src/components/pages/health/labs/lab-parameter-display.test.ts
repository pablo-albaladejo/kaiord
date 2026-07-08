import { LAB_PARAMETER_CATALOG } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  getLabParameterDisplay,
  LAB_PARAMETER_DISPLAY_KEYS,
} from "./lab-parameter-display";

describe("lab parameter display map", () => {
  it("should provide a display entry for every core catalog key", () => {
    // Arrange
    const catalogKeys = LAB_PARAMETER_CATALOG.map((p) => p.key);

    // Act
    const missing = catalogKeys.filter((key) => !getLabParameterDisplay(key));

    // Assert
    expect(missing).toEqual([]);
  });

  it("should not define any display key outside the core catalog", () => {
    // Arrange
    const catalogKeys = new Set(LAB_PARAMETER_CATALOG.map((p) => p.key));

    // Act
    const orphans = LAB_PARAMETER_DISPLAY_KEYS.filter(
      (key) => !catalogKeys.has(key)
    );

    // Assert
    expect(orphans).toEqual([]);
  });

  it("should expose an English name and abbrev for a known key", () => {
    // Arrange
    const key = "ferritin";

    // Act
    const display = getLabParameterDisplay(key);

    // Assert
    expect(display).toEqual({ name: "Ferritin", abbrev: "FERR" });
  });

  it("should render the Spanish name for a known parameter", () => {
    // Arrange
    const key = "glucose";

    // Act
    const display = getLabParameterDisplay(key, "es");

    // Assert
    expect(display).toEqual({ name: "Glucosa (ayunas)", abbrev: "GLU" });
  });

  it("should keep the abbreviation identical across locales", () => {
    // Arrange
    const key = "hdl";

    // Act
    const en = getLabParameterDisplay(key, "en");
    const es = getLabParameterDisplay(key, "es");

    // Assert
    expect(es?.abbrev).toBe(en?.abbrev);
  });
});
