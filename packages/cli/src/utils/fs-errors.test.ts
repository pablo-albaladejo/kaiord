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

  it("should return false for null", () => {
    // Arrange

    // Act
    const result = isNodeSystemError(null);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false for undefined", () => {
    // Arrange

    // Act
    const result = isNodeSystemError(undefined);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false for a string", () => {
    // Arrange

    // Act
    const result = isNodeSystemError("ENOENT");

    // Assert
    expect(result).toBe(false);
  });

  it("should return false for a plain object with code", () => {
    // Arrange

    // Act
    const result = isNodeSystemError({ code: "ENOENT", message: "test" });

    // Assert
    expect(result).toBe(false);
  });

  it("should allow access to code property when type guard passes", () => {
    // Arrange

    // Act
    const error = Object.assign(new Error("test"), { code: "EACCES" });

    // Assert
    expect(isNodeSystemError(error)).toBe(true);
    if (isNodeSystemError(error)) {
      expect(error.code).toBe("EACCES");
    }
  });
});
