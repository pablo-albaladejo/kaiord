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
import {
  DEBOUNCE_BETWEEN_CALLS_MS,
  DEBOUNCE_CALLBACK_CALLS_ONCE,
  DEBOUNCE_DEFAULT_POST_DELAY_MS,
  DEBOUNCE_DEFAULT_PRE_DELAY_MS,
  DEBOUNCE_DELAY_MEDIUM_MS,
  DEBOUNCE_DELAY_SHORT_MS,
  DEBOUNCE_INPUT_VALUE_FIRST,
  DEBOUNCE_INPUT_VALUE_SECOND,
  DEBOUNCE_INPUT_VALUE_THIRD,
  DEBOUNCE_VALIDATOR_CALLS_ONCE,
  DEBOUNCE_WAIT_AFTER_MEDIUM_MS,
  DEBOUNCE_WAIT_AFTER_SHORT_MS,
  MERGED_ERRORS_ONE,
  MERGED_ERRORS_THREE,
  MERGED_ERRORS_TWO,
  NESTED_RESULT_NONE,
  NESTED_RESULT_ONE,
  NESTED_RESULT_TWO,
  STEP_INDEX_FIRST,
  STEP_INDEX_SECOND,
} from "./helpers.test-fixtures";

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
        {
          path: ["steps", STEP_INDEX_FIRST, "duration"],
          message: "Invalid duration",
        },
      ];

      // Act
      const result = getFieldError(errors, [
        "steps",
        STEP_INDEX_FIRST,
        "duration",
      ]);

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
        {
          path: ["steps", STEP_INDEX_FIRST, "target"],
          message: "Invalid target",
        },
      ];

      // Act
      const result = hasFieldError(errors, [
        "steps",
        STEP_INDEX_FIRST,
        "target",
      ]);

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
        {
          path: ["steps", STEP_INDEX_FIRST, "duration"],
          message: "Invalid duration",
        },
        {
          path: ["steps", STEP_INDEX_FIRST, "target"],
          message: "Invalid target",
        },
        {
          path: ["steps", STEP_INDEX_SECOND, "duration"],
          message: "Invalid duration",
        },
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = getNestedErrors(errors, ["steps", STEP_INDEX_FIRST]);

      // Assert
      expect(result).toHaveLength(NESTED_RESULT_TWO);
      expect(result[STEP_INDEX_FIRST].path).toEqual([
        "steps",
        STEP_INDEX_FIRST,
        "duration",
      ]);
      expect(result[STEP_INDEX_SECOND].path).toEqual([
        "steps",
        STEP_INDEX_FIRST,
        "target",
      ]);
    });

    it("should return empty array when no nested errors", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = getNestedErrors(errors, ["steps", STEP_INDEX_FIRST]);

      // Assert
      expect(result).toHaveLength(NESTED_RESULT_NONE);
    });

    it("should not return errors at same level as parent", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["steps"], message: "Required field" },
        {
          path: ["steps", STEP_INDEX_FIRST, "duration"],
          message: "Invalid duration",
        },
      ];

      // Act
      const result = getNestedErrors(errors, ["steps"]);

      // Assert
      expect(result).toHaveLength(NESTED_RESULT_ONE);
      expect(result[STEP_INDEX_FIRST].path).toEqual([
        "steps",
        STEP_INDEX_FIRST,
        "duration",
      ]);
    });

    it("should handle deep nesting", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        {
          path: [
            "extensions",
            "structured_workout",
            "steps",
            STEP_INDEX_FIRST,
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
      expect(result).toHaveLength(NESTED_RESULT_ONE);
      expect(result[STEP_INDEX_FIRST].message).toBe("Must be positive");
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
      expect(result).toHaveLength(MERGED_ERRORS_TWO);
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
      expect(result).toHaveLength(MERGED_ERRORS_ONE);
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
      expect(result).toHaveLength(MERGED_ERRORS_ONE);
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
      expect(result).toHaveLength(MERGED_ERRORS_THREE);
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
      expect(result[STEP_INDEX_FIRST].code).toBe("required");
      expect(result[STEP_INDEX_SECOND].code).toBe("invalid_enum");
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
      const debouncedValidator = createDebouncedValidator(
        mockValidator,
        DEBOUNCE_DELAY_SHORT_MS
      );

      // Act
      debouncedValidator({}, mockCallback);
      debouncedValidator({}, mockCallback);
      debouncedValidator({}, mockCallback);
      await new Promise((resolve) =>
        setTimeout(resolve, DEBOUNCE_WAIT_AFTER_SHORT_MS)
      );

      // Assert
      expect(mockValidator).toHaveBeenCalledTimes(
        DEBOUNCE_VALIDATOR_CALLS_ONCE
      );
      expect(mockCallback).toHaveBeenCalledTimes(DEBOUNCE_CALLBACK_CALLS_ONCE);
    });

    it("should call callback with validation result", async () => {
      // Arrange
      const validationResult = {
        success: false,
        errors: [{ path: ["name"], message: "Required field" }],
      };
      const mockValidator = vi.fn(() => validationResult);
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(
        mockValidator,
        DEBOUNCE_DELAY_MEDIUM_MS
      );

      // Act
      debouncedValidator({ name: "" }, mockCallback);
      await new Promise((resolve) =>
        setTimeout(resolve, DEBOUNCE_WAIT_AFTER_MEDIUM_MS)
      );

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
      await new Promise((resolve) =>
        setTimeout(resolve, DEBOUNCE_DEFAULT_PRE_DELAY_MS)
      );

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      await new Promise((resolve) =>
        setTimeout(resolve, DEBOUNCE_DEFAULT_POST_DELAY_MS)
      );
      expect(mockCallback).toHaveBeenCalledTimes(DEBOUNCE_CALLBACK_CALLS_ONCE);
    });

    it("should cancel previous timeout on new call", async () => {
      // Arrange
      const mockValidator = vi.fn(() => ({
        success: true,
        data: {},
        errors: [],
      }));
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(
        mockValidator,
        DEBOUNCE_DELAY_SHORT_MS
      );

      // Act
      debouncedValidator({ value: DEBOUNCE_INPUT_VALUE_FIRST }, mockCallback);
      await new Promise((resolve) =>
        setTimeout(resolve, DEBOUNCE_BETWEEN_CALLS_MS)
      );
      debouncedValidator({ value: DEBOUNCE_INPUT_VALUE_SECOND }, mockCallback);
      await new Promise((resolve) =>
        setTimeout(resolve, DEBOUNCE_BETWEEN_CALLS_MS)
      );
      debouncedValidator({ value: DEBOUNCE_INPUT_VALUE_THIRD }, mockCallback);
      await new Promise((resolve) =>
        setTimeout(resolve, DEBOUNCE_WAIT_AFTER_SHORT_MS)
      );

      // Assert
      expect(mockValidator).toHaveBeenCalledTimes(
        DEBOUNCE_VALIDATOR_CALLS_ONCE
      );
      expect(mockValidator).toHaveBeenCalledWith({
        value: DEBOUNCE_INPUT_VALUE_THIRD,
      });
    });
  });
});
