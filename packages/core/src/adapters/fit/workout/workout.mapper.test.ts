import { describe, expect, it } from "vitest";
import { buildFitWorkoutMessage } from "../../../tests/fixtures/fit/fit-workout-message.fixtures";
import { createMockLogger } from "../../../tests/helpers/test-utils";
import { mapWorkout } from "./workout.mapper";

describe("mapWorkout", () => {
  describe("subSport mapping", () => {
    it("should map subSport from FIT to KRD", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutMsg = buildFitWorkoutMessage.build({
        sport: "running",
        subSport: "trail",
      });
      const workoutSteps = [];

      // Act
      const result = mapWorkout(workoutMsg, workoutSteps, logger);

      // Assert
      expect(result.subSport).toBe("trail");
    });

    it("should map camelCase subSport to snake_case", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutMsg = buildFitWorkoutMessage.build({
        sport: "cycling",
        subSport: "indoorCycling",
      });
      const workoutSteps = [];

      // Act
      const result = mapWorkout(workoutMsg, workoutSteps, logger);

      // Assert
      expect(result.subSport).toBe("indoor_cycling");
    });

    it("should omit subSport when undefined", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutMsg = buildFitWorkoutMessage.build({
        sport: "running",
      });
      const workoutSteps = [];

      // Act
      const result = mapWorkout(workoutMsg, workoutSteps, logger);

      // Assert
      expect(result).not.toHaveProperty("subSport");
    });

    it("should omit subSport when workoutMsg is undefined", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutSteps = [];

      // Act
      const result = mapWorkout(undefined, workoutSteps, logger);

      // Assert
      expect(result).not.toHaveProperty("subSport");
    });

    it("should handle invalid subSport gracefully", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutMsg = buildFitWorkoutMessage.build({
        sport: "running",
        subSport: "invalid_sub_sport",
      });
      const workoutSteps = [];

      // Act
      const result = mapWorkout(workoutMsg, workoutSteps, logger);

      // Assert
      expect(result.subSport).toBe("generic");
    });
  });

  describe("existing functionality", () => {
    it("should map workout name", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutMsg = buildFitWorkoutMessage.build({
        wktName: "Test Workout",
        sport: "cycling",
      });
      const workoutSteps = [];

      // Act
      const result = mapWorkout(workoutMsg, workoutSteps, logger);

      // Assert
      expect(result.name).toBe("Test Workout");
    });

    it("should map sport", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutMsg = buildFitWorkoutMessage.build({
        sport: "running",
      });
      const workoutSteps = [];

      // Act
      const result = mapWorkout(workoutMsg, workoutSteps, logger);

      // Assert
      expect(result.sport).toBe("running");
    });

    it("should handle undefined workoutMsg", () => {
      // Arrange
      const logger = createMockLogger();
      const workoutSteps = [];

      // Act
      const result = mapWorkout(undefined, workoutSteps, logger);

      // Assert
      expect(result.name).toBeUndefined();
      expect(result.sport).toBe("cycling");
      expect(result.steps).toEqual([]);
    });
  });
});
