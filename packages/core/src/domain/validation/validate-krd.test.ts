import { describe, expect, it } from "vitest";

import { KrdValidationError } from "../types/errors";
import { validateKrd } from "./validate-krd";

const validKrd = {
  version: "1.0",
  type: "recorded_activity",
  metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
};

describe("validateKrd", () => {
  it("should throw a KrdValidationError when the input is not an object", () => {
    // Arrange
    const input = "not-a-krd";

    // Act
    const act = () => validateKrd(input);

    // Assert
    expect(act).toThrow(KrdValidationError);
  });

  it("should throw with the joined field message shape when fields are invalid", () => {
    // Arrange
    const input = { version: 1, type: "recorded_activity" };

    // Act
    let message = "";
    try {
      validateKrd(input);
    } catch (error) {
      message = (error as KrdValidationError).message;
    }

    // Assert
    expect(message).toMatch(/^KRD validation failed: /);
    expect(message).toMatch(/\b\w+: /);
  });

  it("should expose the version field in the validation message when it is missing", () => {
    // Arrange
    const input = { type: "recorded_activity", metadata: {} };

    // Act
    let errors: ReadonlyArray<{ field: string }> = [];
    try {
      validateKrd(input);
    } catch (error) {
      errors = (error as KrdValidationError).errors;
    }

    // Assert
    expect(errors.some((e) => e.field === "version")).toBe(true);
  });

  it("should return the Zod-parsed object rather than the input reference", () => {
    // Arrange
    const input = { ...validKrd };

    // Act
    const result = validateKrd(input);

    // Assert
    expect(result).not.toBe(input);
    expect(result).toStrictEqual(validKrd);
  });
});
