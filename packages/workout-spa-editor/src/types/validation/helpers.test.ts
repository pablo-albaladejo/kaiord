/**
 * Validation Helpers Tests
 *
 * Tests for field-level validation helper functions.
 */

import { describe, expect, it, vi } from "vitest";
import type { ValidationError } from "../../types/krd";
import {
  createDebouncedValidator,
  getFieldError,
  getNestedErrors,
  hasFieldError,
  mergeValidationErrors,
} from "./helpers";

describe("validation helpers", () => {
  describe("getFieldError", () => {
    it("should return error message for matching path", () => {
      // Arrange
      const errors: Array<ValidationError> = [
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
      const errors: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = getFieldError(errors, ["sport"]);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should handle nested paths", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["steps", 0, "duration"], message: "Invalid duration" },
      ];

      // Act
      const result = getFieldError(errors, ["steps", 0, "duration"]);

      // Assert
      expect(result).toBe("Invalid duration");
    });

    it("should return undefined for empty errors array", () => {
      // Arrange
      const errors: Array<ValidationError> = [];

      // Act
      const result = getFieldError(errors, ["name"]);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe("hasFieldError", () => {
    it("should return true for existing error", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = hasFieldError(errors, ["name"]);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for non-existing error", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = hasFieldError(errors, ["sport"]);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle nested paths", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["steps", 0, "target"], message: "Invalid target" },
      ];

      // Act
      const result = hasFieldError(errors, ["steps", 0, "target"]);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for empty errors array", () => {
      // Arrange
      const errors: Array<ValidationError> = [];

      // Act
      const result = hasFieldError(errors, ["name"]);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getNestedErrors", () => {
    it("should return errors under parent path", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["steps", 0, "duration"], message: "Invalid duration" },
        { path: ["steps", 0, "target"], message: "Invalid target" },
        { path: ["steps", 1, "duration"], message: "Invalid duration" },
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = getNestedErrors(errors, ["steps", 0]);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].path).toEqual(["steps", 0, "duration"]);
      expect(result[1].path).toEqual(["steps", 0, "target"]);
    });

    it("should return empty array when no nested errors", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = getNestedErrors(errors, ["steps", 0]);

      // Assert
      expect(result).toHaveLength(0);
    });

    it("should not return errors at same level as parent", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["steps"], message: "Required field" },
        { path: ["steps", 0, "duration"], message: "Invalid duration" },
      ];

      // Act
      const result = getNestedErrors(errors, ["steps"]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].path).toEqual(["steps", 0, "duration"]);
    });

    it("should handle deep nesting", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        {
          path: [
            "extensions",
            "structured_workout",
            "steps",
            0,
            "duration",
            "seconds",
          ],
          message: "Must be positive",
        },
      ];

      // Act
      const result = getNestedErrors(errors, [
        "extensions",
        "structured_workout",
      ]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe("Must be positive");
    });
  });

  describe("mergeValidationErrors", () => {
    it("should merge multiple error arrays", () => {
      // Arrange
      const errors1: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];
      const errors2: Array<ValidationError> = [
        { path: ["sport"], message: "Invalid sport" },
      ];

      // Act
      const result = mergeValidationErrors(errors1, errors2);

      // Assert
      expect(result).toHaveLength(2);
    });

    it("should remove duplicate errors", () => {
      // Arrange
      const errors1: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];
      const errors2: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = mergeValidationErrors(errors1, errors2);

      // Assert
      expect(result).toHaveLength(1);
    });

    it("should handle empty arrays", () => {
      // Arrange
      const errors1: Array<ValidationError> = [];
      const errors2: Array<ValidationError> = [
        { path: ["sport"], message: "Invalid sport" },
      ];

      // Act
      const result = mergeValidationErrors(errors1, errors2);

      // Assert
      expect(result).toHaveLength(1);
    });

    it("should merge more than two arrays", () => {
      // Arrange
      const errors1: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];
      const errors2: Array<ValidationError> = [
        { path: ["sport"], message: "Invalid sport" },
      ];
      const errors3: Array<ValidationError> = [
        { path: ["steps"], message: "Must have at least one step" },
      ];

      // Act
      const result = mergeValidationErrors(errors1, errors2, errors3);

      // Assert
      expect(result).toHaveLength(3);
    });

    it("should preserve error details when merging", () => {
      // Arrange
      const errors1: Array<ValidationError> = [
        { path: ["name"], message: "Required field", code: "required" },
      ];
      const errors2: Array<ValidationError> = [
        { path: ["sport"], message: "Invalid sport", code: "invalid_enum" },
      ];

      // Act
      const result = mergeValidationErrors(errors1, errors2);

      // Assert
      expect(result[0].code).toBe("required");
      expect(result[1].code).toBe("invalid_enum");
    });
  });

  describe("createDebouncedValidator", () => {
    it("should debounce validation calls", async () => {
      // Arrange
      const mockValidator = vi.fn(() => ({
        success: true,
        data: {},
        errors: [],
      }));
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(mockValidator, 100);

      // Act
      debouncedValidator({}, mockCallback);
      debouncedValidator({}, mockCallback);
      debouncedValidator({}, mockCallback);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Assert
      expect(mockValidator).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should call callback with validation result", async () => {
      // Arrange
      const validationResult = {
        success: false,
        errors: [{ path: ["name"], message: "Required field" }],
      };
      const mockValidator = vi.fn(() => validationResult);
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(mockValidator, 50);

      // Act
      debouncedValidator({ name: "" }, mockCallback);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(mockCallback).toHaveBeenCalledWith(validationResult);
    });

    it("should use default delay of 300ms", async () => {
      // Arrange
      const mockValidator = vi.fn(() => ({
        success: true,
        data: {},
        errors: [],
      }));
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(mockValidator);

      // Act
      debouncedValidator({}, mockCallback);

      // Check before delay
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(mockCallback).not.toHaveBeenCalled();

      // Check after delay
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should cancel previous timeout on new call", async () => {
      // Arrange
      const mockValidator = vi.fn(() => ({
        success: true,
        data: {},
        errors: [],
      }));
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(mockValidator, 100);

      // Act
      debouncedValidator({ value: 1 }, mockCallback);
      await new Promise((resolve) => setTimeout(resolve, 50));
      debouncedValidator({ value: 2 }, mockCallback);
      await new Promise((resolve) => setTimeout(resolve, 50));
      debouncedValidator({ value: 3 }, mockCallback);

      // Wait for final debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Assert
      expect(mockValidator).toHaveBeenCalledTimes(1);
      expect(mockValidator).toHaveBeenCalledWith({ value: 3 });
    });
  });
});
