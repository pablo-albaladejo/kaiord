import { describe, expect, it } from "vitest";
import { getErrorTitle, getSuggestionForError } from "./error-suggestions";

describe("getErrorTitle", () => {
  it("should return 'File not found' for file not found errors", () => {
    const error = new Error("File not found: workout.fit");

    const result = getErrorTitle(error);

    expect(result).toBe("File not found");
  });

  it("should return 'Permission denied' for permission errors", () => {
    const error = new Error("Permission denied: /etc/shadow");

    const result = getErrorTitle(error);

    expect(result).toBe("Permission denied");
  });

  it("should return 'Directory creation failed' for mkdir failures", () => {
    const error = new Error("Failed to create directory: /output");

    const result = getErrorTitle(error);

    expect(result).toBe("Directory creation failed");
  });

  it("should return 'Directory creation failed' for cannot create dir", () => {
    const error = new Error("Cannot create directory: /output");

    const result = getErrorTitle(error);

    expect(result).toBe("Directory creation failed");
  });

  it("should return 'Invalid argument combination' for conflicting args", () => {
    const error = new Error("Cannot use both --output and --output-dir");

    const result = getErrorTitle(error);

    expect(result).toBe("Invalid argument combination");
  });

  it("should return 'No files matched' for no files found errors", () => {
    const error = new Error('No files found matching "*.fit"');

    const result = getErrorTitle(error);

    expect(result).toBe("No files matched");
  });

  it("should return 'Invalid argument' for batch mode errors", () => {
    const error = new Error("Batch mode requires --output-dir");

    const result = getErrorTitle(error);

    expect(result).toBe("Invalid argument");
  });

  it("should return 'Invalid argument' for format detection errors", () => {
    const error = new Error("Unable to detect format for file.xyz");

    const result = getErrorTitle(error);

    expect(result).toBe("Invalid argument");
  });

  it("should return 'Invalid argument' for errors with InvalidArgumentError name", () => {
    const error = new Error("Some argument error");
    error.name = "InvalidArgumentError";

    const result = getErrorTitle(error);

    expect(result).toBe("Invalid argument");
  });

  it("should return default message for unknown errors", () => {
    const error = new Error("Something completely unknown");

    const result = getErrorTitle(error);

    expect(result).toBe("An unexpected error occurred");
  });

  it("should match case-insensitively", () => {
    const error = new Error("FILE NOT FOUND: workout.fit");

    const result = getErrorTitle(error);

    expect(result).toBe("File not found");
  });
});

describe("getSuggestionForError", () => {
  it("should return suggestions for file not found errors", () => {
    const error = new Error("File not found: workout.fit");

    const result = getSuggestionForError(error);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result?.[0]).toContain("file path is correct");
  });

  it("should return suggestions for permission denied errors", () => {
    const error = new Error("Permission denied: /restricted");

    const result = getSuggestionForError(error);

    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("permissions");
  });

  it("should return suggestions for no files matched errors", () => {
    const error = new Error('No files found matching "*.tcx"');

    const result = getSuggestionForError(error);

    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("glob pattern");
  });

  it("should return suggestions for batch mode errors", () => {
    const error = new Error("Batch mode requires --output-dir");

    const result = getSuggestionForError(error);

    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("--output-dir");
  });

  it("should return suggestions for format detection errors", () => {
    const error = new Error("Unable to detect format");

    const result = getSuggestionForError(error);

    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("--input-format");
  });

  it("should return null for unknown error patterns", () => {
    const error = new Error("Something unknown happened");

    const result = getSuggestionForError(error);

    expect(result).toBeNull();
  });

  it("should return suggestions for directory creation errors", () => {
    const error = new Error("Failed to create directory: /output");

    const result = getSuggestionForError(error);

    expect(result).not.toBeNull();
    expect(result?.[0]).toContain("parent directory exists");
  });

  it("should return suggestions for conflicting argument errors", () => {
    const error = new Error("Cannot use both --output and --output-dir");

    const result = getSuggestionForError(error);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
  });
});
