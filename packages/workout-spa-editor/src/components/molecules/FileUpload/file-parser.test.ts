import { describe, expect, it } from "vitest";

import { ImportError } from "../../../utils/import-workout";
import { createParseError } from "./file-parser";

describe("createParseError", () => {
  it("should pass through inputs that already have a title", () => {
    // Arrange
    const input = { title: "Already Set", message: "ok" };

    // Act
    const result = createParseError(input);

    // Assert
    expect(result).toEqual(input);
  });

  it("should delegate to createImportErrorState for ImportError instances", () => {
    // Arrange
    const cause = new Error("inner");
    const err = new ImportError("Failed to import foo", "fit", cause);

    // Act
    const result = createParseError(err);

    // Assert
    expect(result.title).toBe("Import Failed");
    expect(result.message).toBe("Failed to import foo");
  });

  it("should delegate to createFileParsingErrorState for FileParsingError-shaped objects", () => {
    // Arrange
    const err = {
      name: "FileParsingError",
      message: "oops",
      line: 7,
      column: 3,
    };

    // Act
    const result = createParseError(err);

    // Assert
    expect(result.title).toBe("Invalid File Format");
    expect(result.message).toBe("Failed to parse JSON (line 7, column 3)");
  });

  it("should delegate to createSyntaxErrorState for SyntaxError instances", () => {
    // Arrange
    const err = new SyntaxError("Unexpected token at position 5");

    // Act
    const result = createParseError(err);

    // Assert
    expect(result.title).toBe("Invalid File Format");
    expect(result.message).toBe(
      "Failed to parse JSON: Unexpected token at position 5. Please check your file and try again."
    );
  });

  it.each([
    {
      label: "input-is-not-a-FIT-file",
      message: "input is not a FIT file: corrupted bytes",
    },
    { label: "not-a-FIT-file", message: "not a FIT file" },
    { label: "corrupted", message: "corrupted" },
  ])(
    "should delegate to createUnrecoverableErrorState for $label",
    ({ message }) => {
      // Arrange
      const err = new Error(message);

      // Act
      const result = createParseError(err);

      // Assert
      expect(result.title).toBe("Import Failed");
      expect(result.message).toBe(
        `${message}. Please check your file and try again.`
      );
    }
  );

  it("should delegate to createGenericErrorState for non-matching Error", () => {
    // Arrange
    const err = new Error("something else");

    // Act
    const result = createParseError(err);

    // Assert
    expect(result.title).toBe("File Read Error");
    expect(result.message).toBe(
      "Failed to read file: something else. Please check your file and try again."
    );
  });

  it("should delegate to createGenericErrorState for plain strings", () => {
    // Arrange
    const err = "plain string";

    // Act
    const result = createParseError(err);

    // Assert
    expect(result.title).toBe("File Read Error");
    expect(result.message).toBe(
      "Failed to read file: Unknown error. Please check your file and try again."
    );
  });

  it("should delegate to createGenericErrorState for null", () => {
    // Arrange
    const err = null;

    // Act
    const result = createParseError(err);

    // Assert
    expect(result.title).toBe("File Read Error");
    expect(result.message).toBe(
      "Failed to read file: Unknown error. Please check your file and try again."
    );
  });

  it("should delegate to createGenericErrorState for objects without a title key", () => {
    // Arrange
    const err = { message: "noname", name: "NotMatchingName" };

    // Act
    const result = createParseError(err);

    // Assert
    expect(result.title).toBe("File Read Error");
    expect(result.message).toBe(
      "Failed to read file: Unknown error. Please check your file and try again."
    );
  });
});
