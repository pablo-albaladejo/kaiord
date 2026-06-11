import { describe, expect, it } from "vitest";

import { getErrorTitle, getSuggestionForError } from "./error-suggestions";

const EXPECTED_SUGGESTION_COUNT = 3;

describe("getErrorTitle", () => {
  it("should return 'File not found' for file not found errors", () => {
    // Arrange
    const error = new Error("File not found: workout.fit");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("File not found");
  });

  it("should return 'Permission denied' for permission errors", () => {
    // Arrange
    const error = new Error("Permission denied: /etc/shadow");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("Permission denied");
  });

  it("should return 'Directory creation failed' for mkdir failures", () => {
    // Arrange
    const error = new Error("Failed to create directory: /output");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("Directory creation failed");
  });

  it("should return 'Directory creation failed' for cannot create dir", () => {
    // Arrange
    const error = new Error("Cannot create directory: /output");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("Directory creation failed");
  });

  it("should return 'Invalid argument combination' for conflicting args", () => {
    // Arrange
    const error = new Error("Cannot use both --output and --output-dir");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("Invalid argument combination");
  });

  it("should return 'No files matched' for no files found errors", () => {
    // Arrange
    const error = new Error('No files found matching "*.fit"');

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("No files matched");
  });

  it("should return 'Invalid argument' for batch mode errors", () => {
    // Arrange
    const error = new Error("Batch mode requires --output-dir");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("Invalid argument");
  });

  it("should return 'Invalid argument' for format detection errors", () => {
    // Arrange
    const error = new Error("Unable to detect format for file.xyz");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("Invalid argument");
  });

  it("should return 'Invalid argument' for errors with InvalidArgumentError name", () => {
    // Arrange
    const error = new Error("Some argument error");
    error.name = "InvalidArgumentError";

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("Invalid argument");
  });

  it("should return default message for unknown errors", () => {
    // Arrange
    const error = new Error("Something completely unknown");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("An unexpected error occurred");
  });

  it("should match case-insensitively", () => {
    // Arrange
    const error = new Error("FILE NOT FOUND: workout.fit");

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe("File not found");
  });
});

describe("getSuggestionForError", () => {
  it("should return suggestions for file not found errors", () => {
    // Arrange
    const error = new Error("File not found: workout.fit");

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toHaveLength(EXPECTED_SUGGESTION_COUNT);
    expect(result?.[0]).toContain("file path is correct");
  });

  it("should return suggestions for permission denied errors", () => {
    // Arrange
    const error = new Error("Permission denied: /restricted");

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("permissions");
  });

  it("should return suggestions for no files matched errors", () => {
    // Arrange
    const error = new Error('No files found matching "*.tcx"');

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("glob pattern");
  });

  it("should return suggestions for batch mode errors", () => {
    // Arrange
    const error = new Error("Batch mode requires --output-dir");

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("--output-dir");
  });

  it("should return suggestions for format detection errors", () => {
    // Arrange
    const error = new Error("Unable to detect format");

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("--input-format");
  });

  it("should return null for unknown error patterns", () => {
    // Arrange
    const error = new Error("Something unknown happened");

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).toBeNull();
  });

  it("should return suggestions for directory creation errors", () => {
    // Arrange
    const error = new Error("Failed to create directory: /output");

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("parent directory exists");
  });

  it("should return suggestions for conflicting argument errors", () => {
    // Arrange
    const error = new Error("Cannot use both --output and --output-dir");

    // Act
    const result = getSuggestionForError(error);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
  });
});
