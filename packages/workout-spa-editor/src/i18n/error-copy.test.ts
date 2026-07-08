import { describe, expect, it } from "vitest";

import {
  localizeAiError,
  localizeValidationMessage,
  validationHeading,
} from "./error-copy";

const MAX_LEN = 2000;
const OVER_LEN = 2050;

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

describe("localizeAiError", () => {
  it("should localize the empty-input reason to Spanish", () => {
    // Arrange
    const error = { reason: "input_empty", message: "Input text is empty" };

    // Act
    const out = localizeAiError(error, "es");

    // Assert
    expect(out).toBe("El texto de entrada está vacío");
  });

  it("should interpolate details into the too-long reason for es", () => {
    // Arrange
    const error = {
      reason: "input_too_long",
      message: "raw",
      details: { maxLength: MAX_LEN, actualLength: OVER_LEN },
    };

    // Act
    const out = localizeAiError(error, "es");

    // Assert
    expect(out).toBe("El texto supera los 2000 caracteres (introducidos 2050)");
  });

  it("should reproduce the English message for the too-long reason under en", () => {
    // Arrange
    const error = {
      reason: "input_too_long",
      message: "orig",
      details: { maxLength: MAX_LEN, actualLength: OVER_LEN },
    };

    // Act
    const out = localizeAiError(error, "en");

    // Assert
    expect(out).toBe("Input text exceeds 2000 characters (got 2050)");
  });

  it("should fall back to the upstream message for a reasonless error", () => {
    // Arrange
    const error = new Error("Provider timeout");

    // Act
    const out = localizeAiError(error, "es");

    // Assert
    expect(out).toBe("Provider timeout");
  });

  it("should return the generic generation-failed copy for a non-error", () => {
    // Arrange
    const error = "weird failure";

    // Act
    const out = localizeAiError(error, "es");

    // Assert
    expect(out).toBe("No se pudo generar");
  });
});
