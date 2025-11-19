/**
 * KRD Validator Tests
 */

import { describe, expect, it } from "vitest";
import { ValidationError } from "../types/errors";
import { validateKRD } from "./krd-validator";

describe("validateKRD", () => {
  describe("valid KRD", () => {
    it("should validate minimal valid workout KRD", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            sport: "running",
            steps: [],
          },
        },
      };

      // Act
      const result = validateKRD(data);

      // Assert
      expect(result).toStrictEqual(data);
    });

    it("should validate activity KRD", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "activity",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
      };

      // Act
      const result = validateKRD(data);

      // Assert
      expect(result).toStrictEqual(data);
    });
  });

  describe("missing required fields", () => {
    it("should throw ValidationError when version is missing", () => {
      // Arrange
      const data = {
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "version",
            message: "Missing required field",
          });
        }
      }
    });

    it("should throw ValidationError when type is missing", () => {
      // Arrange
      const data = {
        version: "1.0",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "type",
            message: "Missing required field",
          });
        }
      }
    });

    it("should throw ValidationError when metadata is missing", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "workout",
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "metadata",
            message: "Missing required field",
          });
        }
      }
    });

    it("should throw ValidationError when metadata.created is missing", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "workout",
        metadata: {
          sport: "running",
        },
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "metadata.created",
            message: "Missing required field",
          });
        }
      }
    });

    it("should throw ValidationError when metadata.sport is missing", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
        },
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "metadata.sport",
            message: "Missing required field",
          });
        }
      }
    });

    it("should throw ValidationError when extensions.workout is missing for workout type", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {},
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "extensions.workout",
            message: "Missing required field for workout type",
          });
        }
      }
    });

    it("should list all missing fields", () => {
      // Arrange
      const data = {};

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors.length).toBeGreaterThan(1);
          expect(error.message).toBe("KRD validation failed");
        }
      }
    });
  });

  describe("invalid field values", () => {
    it("should throw ValidationError when version is not a string", () => {
      // Arrange
      const data = {
        version: 1.0,
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "version",
            message: "Invalid value",
          });
        }
      }
    });

    it("should throw ValidationError when type is invalid", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "invalid",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "type",
            message: "Invalid value",
          });
        }
      }
    });

    it("should throw ValidationError when metadata is not an object", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "workout",
        metadata: "invalid",
      };

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "metadata",
            message: "Must be an object",
          });
        }
      }
    });

    it("should throw ValidationError when data is not an object", () => {
      // Arrange
      const data = "invalid";

      // Act & Assert
      try {
        validateKRD(data);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.errors).toContainEqual({
            field: "root",
            message: "Expected an object",
          });
        }
      }
    });
  });
});
