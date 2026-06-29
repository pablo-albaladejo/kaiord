import { describe, expect, it } from "vitest";

import { isNodeSystemError } from "./fs-errors";

describe("isNodeSystemError", () => {
  it("should return true for Error with code property", () => {
    // Arrange
    const error = Object.assign(new Error("test"), { code: "ENOENT" });

    // Act
    const result = isNodeSystemError(error);

    // Assert
    expect(result).toBe(true);
  });

  it("should return false for plain Error without code", () => {
    // Arrange
    const error = new Error("test");

    // Act
    const result = isNodeSystemError(error);

    // Assert
    expect(result).toBe(false);
  });

  it.each<[string, unknown]>([
    ["null", null],
    ["undefined", undefined],
    ["a string", "ENOENT"],
    ["a plain object with code", { code: "ENOENT", message: "test" }],
  ])("should return false for %s", (_label, input) => {
    // Arrange

    // Act
    const result = isNodeSystemError(input);

    // Assert
    expect(result).toBe(false);
  });
});
