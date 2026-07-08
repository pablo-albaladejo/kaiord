import { describe, expect, it } from "vitest";

import { createTranslator } from "./create-translator";
import type { LocaleResources } from "./types";

const RESOURCES: LocaleResources = {
  en: {
    common: { greeting: "Hello {{name}}", onlyEn: "English only" },
    labs: { glucose: "Glucose (fasting)" },
  },
  es: {
    common: { greeting: "Hola {{name}}" },
    labs: { glucose: "Glucosa (ayunas)" },
  },
};

describe("createTranslator", () => {
  it("should resolve a key in the active locale", () => {
    // Arrange
    const { t } = createTranslator({ locale: "es", resources: RESOURCES });

    // Act
    const result = t("labs:glucose");

    // Assert
    expect(result).toBe("Glucosa (ayunas)");
  });

  it("should fall back to the English value when the key is missing in es", () => {
    // Arrange
    const { t } = createTranslator({ locale: "es", resources: RESOURCES });

    // Act
    const result = t("common:onlyEn");

    // Assert
    expect(result).toBe("English only");
  });

  it("should resolve an unsupported locale to English", () => {
    // Arrange
    const translator = createTranslator({ locale: "fr", resources: RESOURCES });

    // Act
    const greeting = translator.t("common:greeting", { name: "Ana" });

    // Assert
    expect(translator.locale).toBe("en");
    expect(greeting).toBe("Hello Ana");
  });

  it("should render interpolation parameters", () => {
    // Arrange
    const { t } = createTranslator({ locale: "es", resources: RESOURCES });

    // Act
    const result = t("common:greeting", { name: "Ana" });

    // Assert
    expect(result).toBe("Hola Ana");
  });

  it("should isolate instances so one locale does not affect another", () => {
    // Arrange
    const en = createTranslator({ locale: "en", resources: RESOURCES });
    const es = createTranslator({ locale: "es", resources: RESOURCES });

    // Act
    const enValue = en.t("labs:glucose");
    const esValue = es.t("labs:glucose");

    // Assert
    expect(enValue).toBe("Glucose (fasting)");
    expect(esValue).toBe("Glucosa (ayunas)");
  });
});
