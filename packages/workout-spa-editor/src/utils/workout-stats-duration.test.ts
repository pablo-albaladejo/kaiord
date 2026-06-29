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

const FIVE_MIN_SECONDS = 300;
const TEN_MIN_SECONDS = 600;
const ONE_KM_METERS = 1000;
const FIVE_KM_METERS = 5000;

describe("workout-stats-duration", () => {
  describe("calculateStepDuration", () => {
    it("should calculate duration for time-based steps", () => {
      // Arrange
      const duration: Duration = { type: "time", seconds: FIVE_MIN_SECONDS };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBe(FIVE_MIN_SECONDS);
    });

    it("should calculate duration for repeat_until_time", () => {
      // Arrange
      const duration: Duration = {
        type: "repeat_until_time",
        seconds: TEN_MIN_SECONDS,
      };

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBe(TEN_MIN_SECONDS);
    });

    it.each<{ duration: Duration }>([
      { duration: { type: "open" } },
      { duration: { type: "distance", meters: 1000 } },
      { duration: { type: "heart_rate_less_than", bpm: 140 } },
      { duration: { type: "power_less_than", watts: 200 } },
      { duration: { type: "calories", calories: 500 } },
    ])("should return null for $duration.type duration", ({ duration }) => {
      // Arrange

      // Act
      const result = calculateStepDuration(duration);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("calculateStepDistance", () => {
    it("should calculate distance for distance-based steps", () => {
      // Arrange
      const duration: Duration = { type: "distance", meters: ONE_KM_METERS };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBe(ONE_KM_METERS);
    });

    it("should calculate distance for repeat_until_distance", () => {
      // Arrange
      const duration: Duration = {
        type: "repeat_until_distance",
        meters: FIVE_KM_METERS,
      };

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBe(FIVE_KM_METERS);
    });

    it.each<{ duration: Duration }>([
      { duration: { type: "time", seconds: 300 } },
      { duration: { type: "open" } },
      { duration: { type: "repeat_until_heart_rate_greater_than", bpm: 160 } },
      { duration: { type: "power_greater_than", watts: 250 } },
    ])("should return null for $duration.type distance", ({ duration }) => {
      // Arrange

      // Act
      const result = calculateStepDistance(duration);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("isOpenDuration", () => {
    it.each<{ duration: Duration }>([
      { duration: { type: "open" } },
      { duration: { type: "heart_rate_less_than", bpm: 140 } },
      { duration: { type: "repeat_until_heart_rate_greater_than", bpm: 160 } },
      { duration: { type: "power_less_than", watts: 200 } },
      { duration: { type: "repeat_until_power_greater_than", watts: 300 } },
    ])("should return true for $duration.type duration", ({ duration }) => {
      // Arrange

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(true);
    });

    it.each<{ duration: Duration }>([
      { duration: { type: "time", seconds: 300 } },
      { duration: { type: "distance", meters: 1000 } },
      { duration: { type: "calories", calories: 500 } },
    ])("should return false for $duration.type duration", ({ duration }) => {
      // Arrange

      // Act
      const result = isOpenDuration(duration);

      // Assert
      expect(result).toBe(false);
    });
  });
});
