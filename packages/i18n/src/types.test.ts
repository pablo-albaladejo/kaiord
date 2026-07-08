import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, isSupportedLocale, normalizeLocale } from "./types";

describe("isSupportedLocale", () => {
  it("should accept the supported locales en and es", () => {
    // Arrange
    const inputs = ["en", "es"];

    // Act
    const results = inputs.map(isSupportedLocale);

    // Assert
    expect(results).toEqual([true, true]);
  });

  it("should reject an unsupported tag", () => {
    // Arrange
    const input = "fr";

    // Act
    const result = isSupportedLocale(input);

    // Assert
    expect(result).toBe(false);
  });
});

describe("normalizeLocale", () => {
  it("should map any Spanish region tag to es", () => {
    // Arrange
    const tags = ["es", "es-ES", "es-419", "ES-es"];

    // Act
    const results = tags.map(normalizeLocale);

    // Assert
    expect(results).toEqual(["es", "es", "es", "es"]);
  });

  it("should map English or unsupported tags to the default locale", () => {
    // Arrange
    const tags = ["en", "en-US", "fr", "de-DE", ""];

    // Act
    const results = tags.map(normalizeLocale);

    // Assert
    expect(results.every((r) => r === DEFAULT_LOCALE)).toBe(true);
  });
});
