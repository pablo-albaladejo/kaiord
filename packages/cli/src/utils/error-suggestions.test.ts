import { describe, expect, it } from "vitest";

import { getErrorTitle, getSuggestionForError } from "./error-suggestions";

describe("getErrorTitle", () => {
  it.each<[string, string | undefined, string]>([
    ["File not found: workout.fit", undefined, "File not found"],
    ["Permission denied: /etc/shadow", undefined, "Permission denied"],
    [
      "Failed to create directory: /output",
      undefined,
      "Directory creation failed",
    ],
    [
      "Cannot create directory: /output",
      undefined,
      "Directory creation failed",
    ],
    [
      "Cannot use both --output and --output-dir",
      undefined,
      "Invalid argument combination",
    ],
    ['No files found matching "*.fit"', undefined, "No files matched"],
    ["Batch mode requires --output-dir", undefined, "Invalid argument"],
    ["Unable to detect format for file.xyz", undefined, "Invalid argument"],
    ["Some argument error", "InvalidArgumentError", "Invalid argument"],
    ["Something completely unknown", undefined, "An unexpected error occurred"],
    ["FILE NOT FOUND: workout.fit", undefined, "File not found"],
  ])("should return %j as the error title", (message, name, expectedTitle) => {
    // Arrange
    const error = new Error(message);
    if (name) error.name = name;

    // Act
    const result = getErrorTitle(error);

    // Assert
    expect(result).toBe(expectedTitle);
  });
});

describe("getSuggestionForError", () => {
  it.each<[string, string | null]>([
    ["File not found: workout.fit", "file path is correct"],
    ["Permission denied: /restricted", "permissions"],
    ['No files found matching "*.tcx"', "glob pattern"],
    ["Batch mode requires --output-dir", "--output-dir"],
    ["Unable to detect format", "--input-format"],
    ["Failed to create directory: /output", "parent directory exists"],
    ["Cannot use both --output and --output-dir", "single file conversion"],
    ["Something unknown happened", null],
  ])(
    "should return the matching suggestion for %j",
    (message, expectedSubstring) => {
      // Arrange
      const error = new Error(message);

      // Act
      const result = getSuggestionForError(error);

      // Assert
      if (expectedSubstring === null) {
        expect(result).toBeNull();
      } else {
        expect(result).not.toBeNull();
        expect(result?.[0]).toContain(expectedSubstring);
      }
    }
  );
});
