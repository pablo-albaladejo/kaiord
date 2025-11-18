import { describe, expect, it } from "vitest";
import {
  FitParsingError,
  KrdValidationError,
  TcxParsingError,
  TcxValidationError,
  ToleranceExceededError,
  ZwiftParsingError,
  ZwiftValidationError,
  createFitParsingError,
  createKrdValidationError,
  createTcxParsingError,
  createToleranceExceededError,
  createZwiftParsingError,
  createZwiftValidationError,
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

  describe("TcxParsingError", () => {
    it("should create error with message", () => {
      // Arrange
      const message = "Failed to parse TCX file";

      // Act
      const error = new TcxParsingError(message);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TcxParsingError);
      expect(error.name).toBe("TcxParsingError");
      expect(error.message).toBe("Failed to parse TCX file");
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it("should create error with message and cause", () => {
      // Arrange
      const message = "Failed to parse TCX file";
      const cause = new Error("Invalid XML structure");

      // Act
      const error = new TcxParsingError(message, cause);

      // Assert
      expect(error).toBeInstanceOf(TcxParsingError);
      expect(error.message).toBe("Failed to parse TCX file");
      expect(error.cause).toBe(cause);
    });

    it("should work with instanceof checks", () => {
      // Arrange
      const error = new TcxParsingError("Test");

      // Act & Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof TcxParsingError).toBe(true);
      expect(error instanceof FitParsingError).toBe(false);
      expect(error instanceof KrdValidationError).toBe(false);
    });

    it("should preserve stack trace", () => {
      // Arrange & Act
      const error = new TcxParsingError("Test error");

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("TcxParsingError");
      expect(error.stack).toContain("Test error");
    });
  });

  describe("createTcxParsingError factory", () => {
    it("should create TcxParsingError via factory function", () => {
      // Arrange
      const message = "Factory test";

      // Act
      const error = createTcxParsingError(message);

      // Assert
      expect(error).toBeInstanceOf(TcxParsingError);
      expect(error.message).toBe("Factory test");
    });

    it("should create error with cause via factory", () => {
      // Arrange
      const message = "Factory test";
      const cause = new Error("Original error");

      // Act
      const error = createTcxParsingError(message, cause);

      // Assert
      expect(error.cause).toBe(cause);
    });
  });

  describe("ZwiftParsingError", () => {
    it("should create error with message", () => {
      // Arrange
      const message = "Failed to parse Zwift file";

      // Act
      const error = new ZwiftParsingError(message);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ZwiftParsingError);
      expect(error.name).toBe("ZwiftParsingError");
      expect(error.message).toBe("Failed to parse Zwift file");
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it("should create error with message and cause", () => {
      // Arrange
      const message = "Failed to parse Zwift file";
      const cause = new Error("Invalid XML structure");

      // Act
      const error = new ZwiftParsingError(message, cause);

      // Assert
      expect(error).toBeInstanceOf(ZwiftParsingError);
      expect(error.message).toBe("Failed to parse Zwift file");
      expect(error.cause).toBe(cause);
    });

    it("should work with instanceof checks", () => {
      // Arrange
      const error = new ZwiftParsingError("Test");

      // Act & Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ZwiftParsingError).toBe(true);
      expect(error instanceof FitParsingError).toBe(false);
      expect(error instanceof TcxParsingError).toBe(false);
      expect(error instanceof KrdValidationError).toBe(false);
    });

    it("should preserve stack trace", () => {
      // Arrange & Act
      const error = new ZwiftParsingError("Test error");

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("ZwiftParsingError");
      expect(error.stack).toContain("Test error");
    });
  });

  describe("createZwiftParsingError factory", () => {
    it("should create ZwiftParsingError via factory function", () => {
      // Arrange
      const message = "Factory test";

      // Act
      const error = createZwiftParsingError(message);

      // Assert
      expect(error).toBeInstanceOf(ZwiftParsingError);
      expect(error.message).toBe("Factory test");
    });

    it("should create error with cause via factory", () => {
      // Arrange
      const message = "Factory test";
      const cause = new Error("Original error");

      // Act
      const error = createZwiftParsingError(message, cause);

      // Assert
      expect(error.cause).toBe(cause);
    });
  });

  describe("ZwiftValidationError", () => {
    it("should create error with message and errors", () => {
      // Arrange
      const message = "Zwift validation failed";
      const errors = [
        { path: "workout_file.name", message: "Required attribute missing" },
        { path: "workout_file.sportType", message: "Invalid value" },
      ];

      // Act
      const error = new ZwiftValidationError(message, errors);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ZwiftValidationError);
      expect(error.name).toBe("ZwiftValidationError");
      expect(error.message).toBe("Zwift validation failed");
      expect(error.errors).toEqual(errors);
      expect(error.stack).toBeDefined();
    });

    it("should create error with empty errors array", () => {
      // Arrange
      const message = "Validation failed";
      const errors: Array<{ path: string; message: string }> = [];

      // Act
      const error = new ZwiftValidationError(message, errors);

      // Assert
      expect(error.errors).toEqual([]);
      expect(error.errors).toHaveLength(0);
    });

    it("should work with instanceof checks", () => {
      // Arrange
      const error = new ZwiftValidationError("Test", []);

      // Act & Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ZwiftValidationError).toBe(true);
      expect(error instanceof TcxValidationError).toBe(false);
      expect(error instanceof FitParsingError).toBe(false);
    });
  });

  describe("createZwiftValidationError factory", () => {
    it("should create ZwiftValidationError via factory function", () => {
      // Arrange
      const message = "Factory test";
      const errors = [{ path: "test.field", message: "test error" }];

      // Act
      const error = createZwiftValidationError(message, errors);

      // Assert
      expect(error).toBeInstanceOf(ZwiftValidationError);
      expect(error.message).toBe("Factory test");
      expect(error.errors).toEqual(errors);
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

    it("should catch TCX parsing errors", () => {
      // Arrange
      const throwTcxError = () => {
        throw new TcxParsingError("TCX parse failed");
      };

      // Act & Assert
      try {
        throwTcxError();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TcxParsingError);
        if (error instanceof TcxParsingError) {
          expect(error.message).toBe("TCX parse failed");
        }
      }
    });

    it("should catch Zwift parsing errors", () => {
      // Arrange
      const throwZwiftError = () => {
        throw new ZwiftParsingError("Zwift parse failed");
      };

      // Act & Assert
      try {
        throwZwiftError();
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ZwiftParsingError);
        if (error instanceof ZwiftParsingError) {
          expect(error.message).toBe("Zwift parse failed");
        }
      }
    });

    it("should distinguish between error types", () => {
      // Arrange
      const errors = [
        new FitParsingError("FIT error"),
        new TcxParsingError("TCX error"),
        new ZwiftParsingError("Zwift error"),
        new KrdValidationError("Validation error", []),
        new ToleranceExceededError("Tolerance error", []),
        new ZwiftValidationError("Zwift validation error", []),
      ];

      // Act & Assert
      for (const error of errors) {
        if (error instanceof FitParsingError) {
          expect(error.name).toBe("FitParsingError");
        } else if (error instanceof TcxParsingError) {
          expect(error.name).toBe("TcxParsingError");
        } else if (error instanceof ZwiftParsingError) {
          expect(error.name).toBe("ZwiftParsingError");
        } else if (error instanceof KrdValidationError) {
          expect(error.name).toBe("KrdValidationError");
        } else if (error instanceof ToleranceExceededError) {
          expect(error.name).toBe("ToleranceExceededError");
        } else if (error instanceof ZwiftValidationError) {
          expect(error.name).toBe("ZwiftValidationError");
        }
      }
    });
  });
});
