import type { ToleranceViolation, ValidationError } from "@kaiord/core";
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";

import { formatError } from "./error-formatter";

const EXPECTED_DURATION_SECONDS = 300;
const ACTUAL_DURATION_SECONDS = 301;

describe("formatError", () => {
  describe("FitParsingError", () => {
    it("should format FitParsingError for pretty terminal output", () => {
      // Arrange
      const error = new FitParsingError("Corrupted file header");

      // Act
      const result = formatError(error, { json: false });
      const stripped = stripAnsi(result);

      // Assert
      expect(stripped).toContain("Error: Failed to parse FIT file");
      expect(stripped).toContain("Corrupted file header");
      expect(stripped).toContain("Suggestion:");
      expect(stripped).toContain("Verify the file is a valid FIT workout file");
    });

    it("should format FitParsingError with cause", () => {
      // Arrange
      const cause = new Error("Original error");
      const error = new FitParsingError("Corrupted file header", cause);

      // Act
      const result = formatError(error, { json: false });
      const stripped = stripAnsi(result);

      // Assert
      expect(stripped).toContain("Corrupted file header");
      expect(stripped).toContain("Cause:");
      expect(stripped).toContain("Original error");
    });

    it("should format FitParsingError as JSON", () => {
      // Arrange
      const error = new FitParsingError("Corrupted file header");

      // Act
      const result = formatError(error, { json: true });
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.success).toBe(false);
      expect(parsed.error.type).toBe("FitParsingError");
      expect(parsed.error.message).toBe("Corrupted file header");
      expect(parsed.error.suggestion).toContain("valid FIT workout file");
    });
  });

  describe("KrdValidationError", () => {
    it("should format KrdValidationError for pretty terminal output", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { field: "version", message: "Required field missing" },
        { field: "type", message: "Invalid value" },
      ];
      const error = new KrdValidationError("Validation failed", errors);

      // Act
      const result = formatError(error, { json: false });
      const stripped = stripAnsi(result);

      // Assert
      expect(stripped).toContain("Error: Invalid KRD format");
      expect(stripped).toContain("Validation errors:");
      expect(stripped).toContain("version: Required field missing");
      expect(stripped).toContain("type: Invalid value");
      expect(stripped).toContain("Suggestion:");
    });

    it("should format KrdValidationError as JSON", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { field: "version", message: "Required field missing" },
      ];
      const error = new KrdValidationError("Validation failed", errors);

      // Act
      const result = formatError(error, { json: true });
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.success).toBe(false);
      expect(parsed.error.type).toBe("KrdValidationError");
      expect(parsed.error.errors).toHaveLength(1);
      expect(parsed.error.errors[0].field).toBe("version");
      expect(parsed.error.errors[0].message).toBe("Required field missing");
    });
  });

  describe("ToleranceExceededError", () => {
    it("should format ToleranceExceededError for pretty terminal output", () => {
      // Arrange
      const violations: Array<ToleranceViolation> = [
        {
          field: "steps[0].duration.seconds",
          expected: EXPECTED_DURATION_SECONDS,
          actual: ACTUAL_DURATION_SECONDS,
          deviation: 1,
          tolerance: 1,
        },
        {
          field: "steps[1].target.value",
          expected: 250,
          actual: 252,
          deviation: 2,
          tolerance: 1,
        },
      ];
      const error = new ToleranceExceededError(
        "Tolerance exceeded",
        violations
      );

      // Act
      const result = formatError(error, { json: false });
      const stripped = stripAnsi(result);

      // Assert
      expect(stripped).toContain("Error: Round-trip conversion failed");
      expect(stripped).toContain("Tolerance violations:");
      expect(stripped).toContain("steps[0].duration.seconds");
      expect(stripped).toContain("expected 300, got 301");
      expect(stripped).toContain("deviation: 1");
      expect(stripped).toContain("tolerance: ±1");
    });

    it("should format ToleranceExceededError as JSON", () => {
      // Arrange
      const violations: Array<ToleranceViolation> = [
        {
          field: "steps[0].duration.seconds",
          expected: EXPECTED_DURATION_SECONDS,
          actual: ACTUAL_DURATION_SECONDS,
          deviation: 1,
          tolerance: 1,
        },
      ];
      const error = new ToleranceExceededError(
        "Tolerance exceeded",
        violations
      );

      // Act
      const result = formatError(error, { json: true });
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.success).toBe(false);
      expect(parsed.error.type).toBe("ToleranceExceededError");
      expect(parsed.error.violations).toHaveLength(1);
      expect(parsed.error.violations[0].field).toBe(
        "steps[0].duration.seconds"
      );
      expect(parsed.error.violations[0].expected).toBe(
        EXPECTED_DURATION_SECONDS
      );
      expect(parsed.error.violations[0].actual).toBe(ACTUAL_DURATION_SECONDS);
    });
  });

  describe("unknown errors", () => {
    it("should format generic Error for pretty terminal output", () => {
      // Arrange
      const error = new Error("Something went wrong");

      // Act
      const result = formatError(error, { json: false });
      const stripped = stripAnsi(result);

      // Assert
      expect(stripped).toContain("Error: An unexpected error occurred");
      expect(stripped).toContain("Something went wrong");
    });

    it("should format generic Error as JSON", () => {
      // Arrange
      const error = new Error("Something went wrong");

      // Act
      const result = formatError(error, { json: true });
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.success).toBe(false);
      expect(parsed.error.type).toBe("Error");
      expect(parsed.error.message).toBe("Something went wrong");
    });

    it("should format non-Error object for pretty terminal output", () => {
      // Arrange
      const error = "String error";

      // Act
      const result = formatError(error, { json: false });
      const stripped = stripAnsi(result);

      // Assert
      expect(stripped).toContain("Error: An unexpected error occurred");
      expect(stripped).toContain("String error");
    });

    it("should format non-Error object as JSON", () => {
      // Arrange
      const error = "String error";

      // Act
      const result = formatError(error, { json: true });
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.success).toBe(false);
      expect(parsed.error.type).toBe("UnknownError");
      expect(parsed.error.message).toBe("String error");
    });
  });
});
