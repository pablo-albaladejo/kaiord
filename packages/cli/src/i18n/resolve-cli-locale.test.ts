import { createTranslator, findParityViolations } from "@kaiord/i18n";
import { describe, expect, it } from "vitest";

import enCatalog from "./en.json";
import esCatalog from "./es.json";
import { activeLocale, t } from "./index.js";
import { resolveCliLocale } from "./resolve-cli-locale.js";

const buildT = (locale: string) =>
  createTranslator({
    locale,
    resources: { en: { cli: enCatalog }, es: { cli: esCatalog } },
    defaultNS: "cli",
  }).t;

describe("resolveCliLocale", () => {
  it("should prefer KAIORD_LANG over the POSIX locale chain", () => {
    // Arrange
    const env = { KAIORD_LANG: "es-ES", LANG: "en_US.UTF-8" };

    // Act
    const locale = resolveCliLocale(env as NodeJS.ProcessEnv);

    // Assert
    expect(locale).toBe("es");
  });

  it("should fall back to the LC_ALL/LANG chain without an override", () => {
    // Arrange
    const env = { LC_ALL: "es_ES.UTF-8" };

    // Act
    const locale = resolveCliLocale(env as NodeJS.ProcessEnv);

    // Assert
    expect(locale).toBe("es");
  });

  it("should default to English for empty or non-Spanish locales", () => {
    // Arrange
    const env = {};

    // Act
    const locale = resolveCliLocale(env as NodeJS.ProcessEnv);

    // Assert
    expect(locale).toBe("en");
  });

  it("should ignore a blank KAIORD_LANG override", () => {
    // Arrange
    const env = { KAIORD_LANG: "  ", LANG: "es_ES.UTF-8" };

    // Act
    const locale = resolveCliLocale(env as NodeJS.ProcessEnv);

    // Assert
    expect(locale).toBe("es");
  });
});

describe("CLI catalog", () => {
  it("should have full en/es key parity", () => {
    // Arrange
    const en = { cli: enCatalog };
    const es = { cli: esCatalog };

    // Act
    const violations = findParityViolations(en, es);

    // Assert
    expect(violations).toEqual([]);
  });

  it("should render English descriptions byte-identically", () => {
    // Arrange
    const translate = buildT("en");

    // Act
    const describe = translate("commands.convert");

    // Assert
    expect(describe).toBe("Convert workout files between formats");
  });

  it("should render Spanish descriptions for the es locale", () => {
    // Arrange
    const translate = buildT("es");

    // Act
    const describe = translate("commands.convert");

    // Assert
    expect(describe).toBe("Convierte archivos de entrenamiento entre formatos");
  });

  it("should interpolate params in output messages", () => {
    // Arrange
    const translate = buildT("en");

    // Act
    const message = translate("output.conversionComplete", {
      input: "a.fit",
      output: "b.krd",
    });

    // Assert
    expect(message).toBe("Conversion complete: a.fit -> b.krd");
  });

  it("should expose a translator bound to a supported locale", () => {
    // Arrange
    const supported = ["en", "es"];

    // Act
    const value = t("commands.convert");

    // Assert
    expect(supported).toContain(activeLocale);
    expect(value.length).toBeGreaterThan(0);
  });
});
