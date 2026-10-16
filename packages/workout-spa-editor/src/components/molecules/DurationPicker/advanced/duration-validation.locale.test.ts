import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { getTranslate } from "../../../../i18n/use-translate";
import { getValueLabel } from "./duration-helpers";
import { validateValue } from "./duration-validation";

describe("advanced duration heart-rate copy in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should translate the heart-rate maximum message", () => {
    // Arrange
    const t = getTranslate("common", "es");

    // Act
    const result = validateValue("heart_rate_less_than", "221", t);

    // Assert
    expect(result.error).toBe("Máximo 220 ppm");
  });

  it("should translate the heart-rate value label", () => {
    // Arrange
    const t = getTranslate("common", "es");

    // Act
    const label = getValueLabel("heart_rate_less_than", t);

    // Assert
    expect(label).toBe("Frecuencia cardíaca (ppm)");
  });

  it("should keep the English message by default", () => {
    // Arrange
    const value = "221";

    // Act
    const result = validateValue("heart_rate_less_than", value);

    // Assert
    expect(result.error).toBe("Maximum 220 bpm");
  });
});
