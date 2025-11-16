/**
 * Duration Calculation Tests
 *
 * Tests for duration and distance calculation helpers.
 */

import { describe, expect, it } from "vitest";
import type { Duration } from "../types/krd";
import {
  calculateStepDistance,
  calculateStepDuration,
  isOpenDuration,
} from "./workout-stats-duration";

describe("workout-stats-duration", () => {
  describe("calculateStepDuration", () => {
    it("should calculate duration for time-based steps", () => {
      // Arrange
      const duration: Duration = { type: "time", seconds: 300 };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBe(300);
    });

    it("should calculate duration for repeat_until_time", () => {
      // Arrange
      const duration: Duration = { type: "repeat_until_time", seconds: 600 };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBe(600);
    });

    it("should return null for open duration", () => {
      // Arrange
      const duration: Duration = { type: "open" };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for distance-based duration", () => {
      // Arrange
      const duration: Duration = { type: "distance", meters: 1000 };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for heart_rate_less_than", () => {
      // Arrange
      const duration: Duration = { type: "heart_rate_less_than", bpm: 140 };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for power_less_than", () => {
      // Arrange
      const duration: Duration = { type: "power_less_than", watts: 200 };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for calories", () => {
      // Arrange
      const duration: Duration = { type: "calories", calories: 500 };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("calculateStepDistance", () => {
    it("should calculate distance for distance-based steps", () => {
      // Arrange
      const duration: Duration = { type: "distance", meters: 1000 };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBe(1000);
    });

    it("should calculate distance for repeat_until_distance", () => {
      // Arrange
      const duration: Duration = {
        type: "repeat_until_distance",
        meters: 5000,
      };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBe(5000);
    });

    it("should return null for time-based duration", () => {
      // Arrange
      const duration: Duration = { type: "time", seconds: 300 };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for open duration", () => {
      // Arrange
      const duration: Duration = { type: "open" };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for heart rate conditional", () => {
      // Arrange
      const duration: Duration = {
        type: "repeat_until_heart_rate_greater_than",
        bpm: 160,
      };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for power conditional", () => {
      // Arrange
      const duration: Duration = { type: "power_greater_than", watts: 250 };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("isOpenDuration", () => {
    it("should return true for open duration", () => {
      // Arrange
      const duration: Duration = { type: "open" };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for heart_rate_less_than", () => {
      // Arrange
      const duration: Duration = { type: "heart_rate_less_than", bpm: 140 };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for repeat_until_heart_rate_greater_than", () => {
      // Arrange
      const duration: Duration = {
        type: "repeat_until_heart_rate_greater_than",
        bpm: 160,
      };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for power_less_than", () => {
      // Arrange
      const duration: Duration = { type: "power_less_than", watts: 200 };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for repeat_until_power_greater_than", () => {
      // Arrange
      const duration: Duration = {
        type: "repeat_until_power_greater_than",
        watts: 300,
      };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for time duration", () => {
      // Arrange
      const duration: Duration = { type: "time", seconds: 300 };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for distance duration", () => {
      // Arrange
      const duration: Duration = { type: "distance", meters: 1000 };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for calories duration", () => {
      // Arrange
      const duration: Duration = { type: "calories", calories: 500 };

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(false);
    });
  });
});
