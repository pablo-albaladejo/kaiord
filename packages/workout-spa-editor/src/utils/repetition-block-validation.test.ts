import { describe, expect, it } from "vitest";

import {
  type RepetitionBlockValidationError,
  validateRepetitionBlockCreation,
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
  });

  describe("minimum repeat count validation", () => {
    it.each([0, 1, -1])(
      "should return error when repeat count is %i",
      (repeatCount) => {
        // Arrange
        const selectedStepIds = ["step-0", "step-1"];

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
      }
    );
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
  });
});
