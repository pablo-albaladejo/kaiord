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
      const result = formatValidationErrors([]);
      expect(result).toBe("");
    });

    it("should format single error", () => {
      const errors = [{ path: ["name"], message: "Required field" }];
      const result = formatValidationErrors(errors);
      expect(result).toBe("name: Required field");
    });

    it("should format multiple errors", () => {
      const errors = [
        { path: ["name"], message: "Required field" },
        { path: ["sport"], message: "Invalid sport" },
      ];
      const result = formatValidationErrors(errors);
      expect(result).toContain("name: Required field");
      expect(result).toContain("sport: Invalid sport");
    });

    it("should handle nested paths", () => {
      const errors = [
        { path: ["steps", 0, "duration"], message: "Invalid duration" },
      ];
      const result = formatValidationErrors(errors);
      expect(result).toBe("steps.0.duration: Invalid duration");
    });
  });

  describe("getFieldError", () => {
    it("should return error message for matching path", () => {
      const errors = [
        { path: ["name"], message: "Required field" },
        { path: ["sport"], message: "Invalid sport" },
      ];
      const result = getFieldError(errors, ["name"]);
      expect(result).toBe("Required field");
    });

    it("should return undefined for non-matching path", () => {
      const errors = [{ path: ["name"], message: "Required field" }];
      const result = getFieldError(errors, ["sport"]);
      expect(result).toBeUndefined();
    });
  });

  describe("hasFieldError", () => {
    it("should return true for existing error", () => {
      const errors = [{ path: ["name"], message: "Required field" }];
      const result = hasFieldError(errors, ["name"]);
      expect(result).toBe(true);
    });

    it("should return false for non-existing error", () => {
      const errors = [{ path: ["name"], message: "Required field" }];
      const result = hasFieldError(errors, ["sport"]);
      expect(result).toBe(false);
    });
  });

  describe("mergeValidationErrors", () => {
    it("should merge multiple error arrays", () => {
      const errors1 = [{ path: ["name"], message: "Required field" }];
      const errors2 = [{ path: ["sport"], message: "Invalid sport" }];
      const result = mergeValidationErrors(errors1, errors2);
      expect(result).toHaveLength(2);
    });

    it("should remove duplicate errors", () => {
      const errors1 = [{ path: ["name"], message: "Required field" }];
      const errors2 = [{ path: ["name"], message: "Required field" }];
      const result = mergeValidationErrors(errors1, errors2);
      expect(result).toHaveLength(1);
    });
  });

  describe("validateWorkoutMetadata", () => {
    it("should validate valid metadata", () => {
      const data = {
        name: "Test Workout",
        sport: "running",
      };
      const result = validateWorkoutMetadata(data);
      expect(result.success).toBe(true);
    });

    it("should reject missing sport", () => {
      const data = {
        name: "Test Workout",
      };
      const result = validateWorkoutMetadata(data);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it("should accept optional fields", () => {
      const data = {
        sport: "swimming",
        poolLength: 25,
        poolLengthUnit: "meters" as const,
      };
      const result = validateWorkoutMetadata(data);
      expect(result.success).toBe(true);
    });
  });

  describe("validatePartialWorkoutStep", () => {
    it("should validate empty partial step", () => {
      const data = {};
      const result = validatePartialWorkoutStep(data);
      expect(result.success).toBe(true);
    });

    it("should validate partial step with some fields", () => {
      const data = {
        stepIndex: 0,
        durationType: "time",
      };
      const result = validatePartialWorkoutStep(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid field values", () => {
      const data = {
        stepIndex: -1, // Invalid: must be non-negative
      };
      const result = validatePartialWorkoutStep(data);
      expect(result.success).toBe(false);
    });
  });
});
