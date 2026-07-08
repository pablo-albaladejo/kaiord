import { describe, expect, it } from "vitest";

import { localizeValidationMessage, validationHeading } from "./error-copy";

describe("localizeValidationMessage", () => {
  it("should localize a known code to Spanish", () => {
    // Arrange
    const entry = { code: "min_gt_max", message: "min must be <= max" };

    // Act
    const out = localizeValidationMessage(entry, "es");

    // Assert
    expect(out).toBe("el mínimo debe ser menor o igual que el máximo");
  });

  it("should return the English dictionary copy for a known code under en", () => {
    // Arrange
    const entry = { code: "duration_type_mismatch", message: "upstream text" };

    // Act
    const out = localizeValidationMessage(entry, "en");

    // Assert
    expect(out).toBe("durationType must match duration.type");
  });

  it("should fall back to the upstream message for an unmapped code", () => {
    // Arrange
    const entry = { code: "invalid_type", message: "Invalid input" };

    // Act
    const out = localizeValidationMessage(entry, "es");

    // Assert
    expect(out).toBe("Invalid input");
  });

  it("should fall back to the upstream message when there is no code", () => {
    // Arrange
    const entry = { message: "Some raw validation message" };

    // Act
    const out = localizeValidationMessage(entry, "es");

    // Assert
    expect(out).toBe("Some raw validation message");
  });
});

describe("validationHeading", () => {
  it("should return the Spanish heading for es", () => {
    // Arrange
    const locale = "es" as const;

    // Act
    const out = validationHeading(locale);

    // Assert
    expect(out).toBe("Errores de validación:");
  });

  it("should default to the English heading", () => {
    // Arrange

    // Act
    const out = validationHeading();

    // Assert
    expect(out).toBe("Validation errors:");
  });
});
