import { describe, expect, it } from "vitest";

import { localizeValidationMessage } from "../i18n/error-copy";
import { ValidationError } from "../types/errors";
import { validateKRD } from "./krd-validator";

const errorsOf = (data: unknown) => {
  try {
    validateKRD(data);
  } catch (error) {
    if (error instanceof ValidationError) return error.errors;
  }
  return [];
};

describe("validateKRD error copy", () => {
  it("should word each failed field in Spanish by its code", () => {
    // Arrange
    const errors = errorsOf({ version: 2, metadata: {} });

    // Act
    const words = errors.map((e) => localizeValidationMessage(e, "es"));

    // Assert
    expect(words).toEqual([
      "Valor no válido",
      "Falta un campo obligatorio",
      "Falta un campo obligatorio",
      "Falta un campo obligatorio",
    ]);
  });

  it("should keep the English message as the fallback copy", () => {
    // Arrange
    const errors = errorsOf(null);

    // Act
    const words = errors.map((e) => localizeValidationMessage(e));

    // Assert
    expect(words).toEqual(["Expected an object"]);
  });
});
