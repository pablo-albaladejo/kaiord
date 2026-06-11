import { describe, expect, it } from "vitest";

import {
  validatePartialWorkoutStep,
  validateWorkoutMetadata,
} from "./validators";

describe("validation validators", () => {
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
