/**
 * Error Types Tests
 */

import { describe, expect, it } from "vitest";
import { ConversionError, FileParsingError, ValidationError } from "./errors";

describe("FileParsingError", () => {
  it("should create error with message only", () => {
    // Arrange & Act
    const error = new FileParsingError("Test error");

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FileParsingError);
    expect(error.name).toBe("FileParsingError");
    expect(error.message).toBe("Test error");
    expect(error.line).toBeUndefined();
    expect(error.column).toBeUndefined();
    expect(error.stack).toBeDefined();
  });

  it("should create error with line and column", () => {
    // Arrange & Act
    const error = new FileParsingError("Test error", 5, 12);

    // Assert
    expect(error.message).toBe("Test error");
    expect(error.line).toBe(5);
    expect(error.column).toBe(12);
  });

  it("should create error with cause", () => {
    // Arrange
    const cause = new Error("Original error");

    // Act
    const error = new FileParsingError("Test error", 5, 12, cause);

    // Assert
    expect(error.cause).toBe(cause);
  });
});

describe("ValidationError", () => {
  it("should create error with field errors", () => {
    // Arrange
    const errors = [
      { field: "version", message: "Required field missing" },
      { field: "type", message: "Invalid value" },
    ];

    // Act
    const error = new ValidationError("Validation failed", errors);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe("ValidationError");
    expect(error.message).toBe("Validation failed");
    expect(error.errors).toStrictEqual(errors);
    expect(error.stack).toBeDefined();
  });

  it("should create error with cause", () => {
    // Arrange
    const cause = new Error("Original error");
    const errors = [{ field: "test", message: "Test error" }];

    // Act
    const error = new ValidationError("Validation failed", errors, cause);

    // Assert
    expect(error.cause).toBe(cause);
  });
});

describe("ConversionError", () => {
  it("should create error with format", () => {
    // Arrange & Act
    const error = new ConversionError("Conversion failed", "fit");

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConversionError);
    expect(error.name).toBe("ConversionError");
    expect(error.message).toBe("Conversion failed");
    expect(error.format).toBe("fit");
    expect(error.details).toBeUndefined();
    expect(error.stack).toBeDefined();
  });

  it("should create error with details", () => {
    // Arrange & Act
    const error = new ConversionError(
      "Conversion failed",
      "tcx",
      "Invalid XML structure"
    );

    // Assert
    expect(error.format).toBe("tcx");
    expect(error.details).toBe("Invalid XML structure");
  });

  it("should create error with cause", () => {
    // Arrange
    const cause = new Error("Original error");

    // Act
    const error = new ConversionError(
      "Conversion failed",
      "zwo",
      "Details",
      cause
    );

    // Assert
    expect(error.cause).toBe(cause);
  });
});
