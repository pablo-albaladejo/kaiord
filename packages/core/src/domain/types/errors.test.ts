import { describe, expect, it } from "vitest";
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
  createFitParsingError,
  createKrdValidationError,
  createToleranceExceededError,
} from "./errors";

describe("Domain Errors", () => {
  describe("FitParsingError", () => {
    it("should create error with message", () => {
      // Arrange
      const message = "Failed to parse FIT file";

      // Act
      const error = new FitParsingError(message);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FitParsingError);
      expect(error.name).toBe("FitParsingError");
      expect(error.message).toBe("Failed to parse FIT file");
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it("should create error with message and cause", () => {
      // Arrange
      const message = "Failed to parse FIT file";
      const cause = new Error("Corrupted data");

      // Act
      const error = new FitParsingError(message, cause);

      // Assert
      expect(error).toBeInstanceOf(FitParsingError);
      expect(error.message).toBe("Failed to parse FIT file");
      expect(error.cause).toBe(cause);
    });

    it("should work with instanceof checks", () => {
      // Arrange
      const error = new FitParsingError("Test");

      // Act & Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof FitParsingError).toBe(true);
      expect(error instanceof KrdValidationError).toBe(false);
    });

    it("should preserve stack trace", () => {
      // Arrange & Act
      const error = new FitParsingError("Test error");

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("FitParsingError");
      expect(error.stack).toContain("Test error");
    });
  });

  describe("createFitParsingError factory", () => {
    it("should create FitParsingError via factory function", () => {
      // Arrange
      const message = "Factory test";

      // Act
      const error = createFitParsingError(message);

      // Assert
      expect(error).toBeInstanceOf(FitParsingError);
      expect(error.message).toBe("Factory test");
    });

    it("should create error with cause via factory", () => {
      // Arrange
      const message = "Factory test";
      const cause = new Error("Original error");

      // Act
      const error = createFitParsingError(message, cause);

      // Assert
      expect(error.cause).toBe(cause);
    });
  });

  describe("KrdValidationError", () => {
    it("should create error with message and errors", () => {
      // Arrange
      const message = "KRD validation failed";
      const errors = [
        { field: "version", message: "Required field missing" },
        { field: "type", message: "Invalid value" },
      ];

      // Act
      const error = new KrdValidationError(message, errors);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(KrdValidationError);
      expect(error.name).toBe("KrdValidationError");
      expect(error.message).toBe("KRD validation failed");
      expect(error.errors).toEqual(errors);
      expect(error.stack).toBeDefined();
    });

    it("should create error with empty errors array", () => {
      // Arrange
      const message = "Validation failed";
      const errors: Array<{ field: string; message: string }> = [];

      // Act
      const error = new KrdValidationError(message, errors);

      // Assert
      expect(error.errors).toEqual([]);
      expect(error.errors).toHaveLength(0);
    });

    it("should work with instanceof checks", () => {
      // Arrange
      const error = new KrdValidationError("Test", []);

      // Act & Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof KrdValidationError).toBe(true);
      expect(error instanceof FitParsingError).toBe(false);
    });
  });

  describe("createKrdValidationError factory", () => {
    it("should create KrdValidationError via factory function", () => {
      // Arrange
      const message = "Factory test";
      const errors = [{ field: "test", message: "test error" }];

      // Act
      const error = createKrdValidationError(message, errors);

      // Assert
      expect(error).toBeInstanceOf(KrdValidationError);
      expect(error.message).toBe("Factory test");
      expect(error.errors).toEqual(errors);
    });
  });

  describe("ToleranceExceededError", () => {
    it("should create error with message and violations", () => {
      // Arrange
      const message = "Tolerance exceeded";
      const violations = [
        {
          field: "power",
          expected: 250,
          actual: 252,
          deviation: 2,
          tolerance: 1,
        },
        {
          field: "heartRate",
          expected: 150,
          actual: 152,
          deviation: 2,
          tolerance: 1,
        },
      ];

      // Act
      const error = new ToleranceExceededError(message, violations);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ToleranceExceededError);
      expect(error.name).toBe("ToleranceExceededError");
      expect(error.message).toBe("Tolerance exceeded");
      expect(error.violations).toEqual(violations);
      expect(error.stack).toBeDefined();
    });

    it("should create error with empty violations array", () => {
      // Arrange
      const message = "No violations";
      const violations: Array<{
        field: string;
        expected: number;
        actual: number;
        deviation: number;
        tolerance: number;
      }> = [];

      // Act
      const error = new ToleranceExceededError(message, violations);

      // Assert
      expect(error.violations).toEqual([]);
      expect(error.violations).toHaveLength(0);
    });

    it("should work with instanceof checks", () => {
      // Arrange
      const error = new ToleranceExceededError("Test", []);

      // Act & Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ToleranceExceededError).toBe(true);
      expect(error instanceof KrdValidationError).toBe(false);
    });
  });

  describe("createToleranceExceededError factory", () => {
    it("should create ToleranceExceededError via factory function", () => {
      // Arrange
      const message = "Factory test";
      const violations = [
        {
          field: "test",
          expected: 100,
          actual: 105,
          deviation: 5,
          tolerance: 1,
        },
      ];

      // Act
      const error = createToleranceExceededError(message, violations);

      // Assert
      expect(error).toBeInstanceOf(ToleranceExceededError);
      expect(error.message).toBe("Factory test");
      expect(error.violations).toEqual(violations);
    });
  });

  describe("Error catching patterns", () => {
    it("should catch specific error types", () => {
      // Arrange
      const throwFitError = () => {
        throw new FitParsingError("Parse failed");
      };

      // Act & Assert
      try {
        throwFitError();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FitParsingError);
        if (error instanceof FitParsingError) {
          expect(error.message).toBe("Parse failed");
        }
      }
    });

    it("should distinguish between error types", () => {
      // Arrange
      const errors = [
        new FitParsingError("FIT error"),
        new KrdValidationError("Validation error", []),
        new ToleranceExceededError("Tolerance error", []),
      ];

      // Act & Assert
      for (const error of errors) {
        if (error instanceof FitParsingError) {
          expect(error.name).toBe("FitParsingError");
        } else if (error instanceof KrdValidationError) {
          expect(error.name).toBe("KrdValidationError");
        } else if (error instanceof ToleranceExceededError) {
          expect(error.name).toBe("ToleranceExceededError");
        }
      }
    });
  });
});
