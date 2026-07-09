import { describe, expect, it } from "vitest";

import {
  localizeAiError,
  localizeValidationMessage,
  validationHeading,
} from "./error-copy";

const MAX_LEN = 2000;
const OVER_LEN = 2050;

describe("localizeValidationMessage", () => {
  it.each([
    {
      name: "localize a known code to Spanish",
      entry: { code: "min_gt_max", message: "min must be <= max" },
      locale: "es" as const,
      expected: "el mínimo debe ser menor o igual que el máximo",
    },
    {
      name: "return the English dictionary copy for a known code under en",
      entry: { code: "duration_type_mismatch", message: "upstream text" },
      locale: "en" as const,
      expected: "durationType must match duration.type",
    },
    {
      name: "fall back to the upstream message for an unmapped code",
      entry: { code: "invalid_type", message: "Invalid input" },
      locale: "es" as const,
      expected: "Invalid input",
    },
    {
      name: "fall back to the upstream message when there is no code",
      entry: { message: "Some raw validation message" },
      locale: "es" as const,
      expected: "Some raw validation message",
    },
  ])("should $name", ({ entry, locale, expected }) => {
    // Arrange

    // Act
    const out = localizeValidationMessage(entry, locale);

    // Assert
    expect(out).toBe(expected);
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
  it.each([
    {
      name: "localize the empty-input reason to Spanish",
      error: { reason: "input_empty", message: "Input text is empty" },
      locale: "es" as const,
      expected: "El texto de entrada está vacío",
    },
    {
      name: "interpolate details into the too-long reason for es",
      error: {
        reason: "input_too_long",
        message: "raw",
        details: { maxLength: MAX_LEN, actualLength: OVER_LEN },
      },
      locale: "es" as const,
      expected: "El texto supera los 2000 caracteres (introducidos 2050)",
    },
    {
      name: "reproduce the English message for the too-long reason under en",
      error: {
        reason: "input_too_long",
        message: "orig",
        details: { maxLength: MAX_LEN, actualLength: OVER_LEN },
      },
      locale: "en" as const,
      expected: "Input text exceeds 2000 characters (got 2050)",
    },
    {
      name: "fall back to the upstream message for a reasonless error",
      error: new Error("Provider timeout"),
      locale: "es" as const,
      expected: "Provider timeout",
    },
    {
      name: "return the generic generation-failed copy for a non-error",
      error: "weird failure",
      locale: "es" as const,
      expected: "No se pudo generar",
    },
  ])("should $name", ({ error, locale, expected }) => {
    // Arrange

    // Act
    const out = localizeAiError(error, locale);

    // Assert
    expect(out).toBe(expected);
  });
});
