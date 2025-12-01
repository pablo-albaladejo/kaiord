import { describe, expect, it } from "vitest";
import {
  validateRepetitionBlockCreation,
  type RepetitionBlockValidationError,
} from "./repetition-block-validation";

describe("validateRepetitionBlockCreation", () => {
  describe("minimum steps validation", () => {
    it("should return error when no steps are selected", () => {
      // Arrange
      const selectedStepIds: Array<string> = [];
      const repeatCount = 3;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toEqual<RepetitionBlockValidationError>({
        type: "MIN_STEPS",
        message: "Select at least 2 steps to create a repetition block",
      });
    });

    it("should return error when only one step is selected", () => {
      // Arrange
      const selectedStepIds = ["step-0"];
      const repeatCount = 3;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toEqual<RepetitionBlockValidationError>({
        type: "MIN_STEPS",
        message: "Select at least 2 steps to create a repetition block",
      });
    });

    it("should pass validation when two steps are selected", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1"];
      const repeatCount = 2;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toBeNull();
    });

    it("should pass validation when multiple steps are selected", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1", "step-2", "step-3"];
      const repeatCount = 3;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("minimum repeat count validation", () => {
    it("should return error when repeat count is 0", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1"];
      const repeatCount = 0;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toEqual<RepetitionBlockValidationError>({
        type: "MIN_REPEAT_COUNT",
        message: "Repeat count must be at least 2",
      });
    });

    it("should return error when repeat count is 1", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1"];
      const repeatCount = 1;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toEqual<RepetitionBlockValidationError>({
        type: "MIN_REPEAT_COUNT",
        message: "Repeat count must be at least 2",
      });
    });

    it("should return error when repeat count is negative", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1"];
      const repeatCount = -1;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toEqual<RepetitionBlockValidationError>({
        type: "MIN_REPEAT_COUNT",
        message: "Repeat count must be at least 2",
      });
    });

    it("should pass validation when repeat count is 2", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1"];
      const repeatCount = 2;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toBeNull();
    });

    it("should pass validation when repeat count is greater than 2", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1"];
      const repeatCount = 10;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("combined validation", () => {
    it("should return MIN_STEPS error first when both validations fail", () => {
      // Arrange
      const selectedStepIds = ["step-0"];
      const repeatCount = 1;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toEqual<RepetitionBlockValidationError>({
        type: "MIN_STEPS",
        message: "Select at least 2 steps to create a repetition block",
      });
    });

    it("should pass validation when all criteria are met", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1", "step-2"];
      const repeatCount = 5;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle empty array correctly", () => {
      // Arrange
      const selectedStepIds: Array<string> = [];
      const repeatCount = 2;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toEqual<RepetitionBlockValidationError>({
        type: "MIN_STEPS",
        message: "Select at least 2 steps to create a repetition block",
      });
    });

    it("should handle very large repeat count", () => {
      // Arrange
      const selectedStepIds = ["step-0", "step-1"];
      const repeatCount = 1000;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toBeNull();
    });

    it("should handle many selected steps", () => {
      // Arrange
      const selectedStepIds = Array.from({ length: 50 }, (_, i) => `step-${i}`);
      const repeatCount = 2;

      // Act
      const result = validateRepetitionBlockCreation(
        selectedStepIds,
        repeatCount
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});
