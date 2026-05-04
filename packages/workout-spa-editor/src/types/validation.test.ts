/**
 * Validation Tests
 *
 * Tests for validation helpers and error formatting.
 */

import { describe, expect, it } from "vitest";

import {
  formatValidationErrors,
  getFieldError,
  hasFieldError,
  mergeValidationErrors,
  validatePartialWorkoutStep,
  validateWorkoutMetadata,
} from "./validation";

describe("Validation Helpers", () => {
  describe("formatValidationErrors", () => {
    it("should return empty string for no errors", () => {
      // Arrange

      // Act

      const result = formatValidationErrors([]);

      // Assert

      expect(result).toBe("");
    });

    it("should format single error", () => {
      // Arrange

      const errors = [{ path: ["name"], message: "Required field" }];

      // Act

      const result = formatValidationErrors(errors);

      // Assert

      expect(result).toBe("name: Required field");
    });

    it("should format multiple errors", () => {
      // Arrange

      const errors = [
        { path: ["name"], message: "Required field" },
        { path: ["sport"], message: "Invalid sport" },
      ];

      // Act

      const result = formatValidationErrors(errors);

      // Assert

      expect(result).toContain("name: Required field");
      expect(result).toContain("sport: Invalid sport");
    });

    it("should handle nested paths", () => {
      // Arrange

      const errors = [
        { path: ["steps", 0, "duration"], message: "Invalid duration" },
      ];

      // Act

      const result = formatValidationErrors(errors);

      // Assert

      expect(result).toBe("steps.0.duration: Invalid duration");
    });
  });

  describe("getFieldError", () => {
    it("should return error message for matching path", () => {
      // Arrange

      const errors = [
        { path: ["name"], message: "Required field" },
        { path: ["sport"], message: "Invalid sport" },
      ];

      // Act

      const result = getFieldError(errors, ["name"]);

      // Assert

      expect(result).toBe("Required field");
    });

    it("should return undefined for non-matching path", () => {
      // Arrange

      const errors = [{ path: ["name"], message: "Required field" }];

      // Act

      const result = getFieldError(errors, ["sport"]);

      // Assert

      expect(result).toBeUndefined();
    });
  });

  describe("hasFieldError", () => {
    it("should return true for existing error", () => {
      // Arrange

      const errors = [{ path: ["name"], message: "Required field" }];

      // Act

      const result = hasFieldError(errors, ["name"]);

      // Assert

      expect(result).toBe(true);
    });

    it("should return false for non-existing error", () => {
      // Arrange

      const errors = [{ path: ["name"], message: "Required field" }];

      // Act

      const result = hasFieldError(errors, ["sport"]);

      // Assert

      expect(result).toBe(false);
    });
  });

  describe("mergeValidationErrors", () => {
    it("should merge multiple error arrays", () => {
      // Arrange

      const errors1 = [{ path: ["name"], message: "Required field" }];
      const errors2 = [{ path: ["sport"], message: "Invalid sport" }];

      // Act

      const result = mergeValidationErrors(errors1, errors2);

      // Assert

      expect(result).toHaveLength(2);
    });

    it("should remove duplicate errors", () => {
      // Arrange

      const errors1 = [{ path: ["name"], message: "Required field" }];
      const errors2 = [{ path: ["name"], message: "Required field" }];

      // Act

      const result = mergeValidationErrors(errors1, errors2);

      // Assert

      expect(result).toHaveLength(1);
    });
  });

  describe("validateWorkoutMetadata", () => {
    it("should validate valid metadata", () => {
      // Arrange

      const data = {
        name: "Test Workout",
        sport: "running",
      };

      // Act

      const result = validateWorkoutMetadata(data);

      // Assert

      expect(result.success).toBe(true);
    });

    it("should reject missing sport", () => {
      // Arrange

      const data = {
        name: "Test Workout",
      };

      // Act

      const result = validateWorkoutMetadata(data);

      // Assert

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it("should accept optional fields", () => {
      // Arrange

      const data = {
        sport: "swimming",
        poolLength: 25,
        poolLengthUnit: "meters" as const,
      };

      // Act

      const result = validateWorkoutMetadata(data);

      // Assert

      expect(result.success).toBe(true);
    });
  });

  describe("validatePartialWorkoutStep", () => {
    it("should validate empty partial step", () => {
      // Arrange

      const data = {};

      // Act

      const result = validatePartialWorkoutStep(data);

      // Assert

      expect(result.success).toBe(true);
    });

    it("should validate partial step with some fields", () => {
      // Arrange

      const data = {
        stepIndex: 0,
        durationType: "time",
      };

      // Act

      const result = validatePartialWorkoutStep(data);

      // Assert

      expect(result.success).toBe(true);
    });

    it("should reject invalid field values", () => {
      // Arrange

      const data = {
        stepIndex: -1, // Invalid: must be non-negative
      };

      // Act

      const result = validatePartialWorkoutStep(data);

      // Assert

      expect(result.success).toBe(false);
    });
  });
});
