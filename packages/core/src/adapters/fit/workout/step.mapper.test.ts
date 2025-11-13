import { describe, expect, it } from "vitest";
import { buildFitWorkoutStep } from "../../../tests/fixtures/fit/fit-workout-step.fixtures";
import { mapStep } from "./step.mapper";

describe("mapStep", () => {
  describe("notes mapping", () => {
    it("should map notes from FIT to KRD", () => {
      // Arrange
      const step = buildFitWorkoutStep.build({
        durationType: "time",
        durationTime: 300,
        targetType: "open",
        notes: "Focus on form and breathing",
      });

      // Act
      const result = mapStep(step, 0);

      // Assert
      expect(result.notes).toBe("Focus on form and breathing");
    });

    it("should omit notes when undefined", () => {
      // Arrange
      const step = buildFitWorkoutStep.build({
        durationType: "time",
        durationTime: 300,
        targetType: "open",
      });

      // Act
      const result = mapStep(step, 0);

      // Assert
      expect(result).not.toHaveProperty("notes");
    });

    it("should handle empty string notes", () => {
      // Arrange
      const step = buildFitWorkoutStep.build({
        durationType: "time",
        durationTime: 300,
        targetType: "open",
        notes: "",
      });

      // Act
      const result = mapStep(step, 0);

      // Assert
      expect(result.notes).toBe("");
    });

    it("should handle long notes", () => {
      // Arrange
      const longNotes = "A".repeat(256);
      const step = buildFitWorkoutStep.build({
        durationType: "time",
        durationTime: 300,
        targetType: "open",
        notes: longNotes,
      });

      // Act
      const result = mapStep(step, 0);

      // Assert
      expect(result.notes).toBe(longNotes);
      expect(result.notes?.length).toBe(256);
    });
  });

  describe("existing functionality", () => {
    it("should map stepIndex from messageIndex", () => {
      // Arrange
      const step = buildFitWorkoutStep.build({
        messageIndex: 5,
        durationType: "time",
        durationTime: 300,
        targetType: "open",
      });

      // Act
      const result = mapStep(step, 0);

      // Assert
      expect(result.stepIndex).toBe(5);
    });

    it("should use index parameter when messageIndex is undefined", () => {
      // Arrange
      const step = buildFitWorkoutStep.build({
        messageIndex: undefined,
        durationType: "time",
        durationTime: 300,
        targetType: "open",
      });

      // Act
      const result = mapStep(step, 3);

      // Assert
      expect(result.stepIndex).toBe(3);
    });

    it("should map step name", () => {
      // Arrange
      const step = buildFitWorkoutStep.build({
        wktStepName: "Warm Up",
        durationType: "time",
        durationTime: 300,
        targetType: "open",
      });

      // Act
      const result = mapStep(step, 0);

      // Assert
      expect(result.name).toBe("Warm Up");
    });

    it("should map intensity", () => {
      // Arrange
      const step = buildFitWorkoutStep.build({
        durationType: "time",
        durationTime: 300,
        targetType: "open",
        intensity: "warmup",
      });

      // Act
      const result = mapStep(step, 0);

      // Assert
      expect(result.intensity).toBe("warmup");
    });
  });
});
