import { describe, expect, it } from "vitest";

import { resolveLocale } from "./resolve-locale";

describe("resolveLocale", () => {
  it("should honor an explicit es preference over the browser language", () => {
    // Arrange
    const preference = "es" as const;

    // Act
    const result = resolveLocale(preference, "en-US");

    // Assert
    expect(result).toBe("es");
  });

  it("should honor an explicit en preference over a Spanish browser", () => {
    // Arrange
    const preference = "en" as const;

    // Act
    const result = resolveLocale(preference, "es-ES");

    // Assert
    expect(result).toBe("en");
  });

  it("should resolve auto to es for a Spanish browser language", () => {
    // Arrange
    const preference = "auto" as const;

    // Act
    const result = resolveLocale(preference, "es-419");

    // Assert
    expect(result).toBe("es");
  });

  it("should resolve auto to en for a non-Spanish browser language", () => {
    // Arrange
    const preference = "auto" as const;

    // Act
    const result = resolveLocale(preference, "fr-FR");

    // Assert
    expect(result).toBe("en");
  });

  it("should treat an absent preference as auto", () => {
    // Arrange
    const preference = undefined;

    // Act
    const result = resolveLocale(preference, "es-ES");

    // Assert
    expect(result).toBe("es");
  });
});
