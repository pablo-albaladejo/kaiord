import { describe, expect, it } from "vitest";
import {
  buildRepetitionBlock,
  buildWorkout,
  buildWorkoutStep,
} from "./workout.fixtures";

describe("Workout Fixtures", () => {
  describe("buildWorkoutStep", () => {
    it("should create a valid workout step with time duration", () => {
      const step = buildWorkoutStep.build({
        durationType: "time",
        duration: { type: "time" as const, seconds: 300 },
      });

      expect(step.stepIndex).toBeGreaterThanOrEqual(0);
      expect(step.durationType).toBe("time");
      expect(step.duration.type).toBe("time");
      if (step.duration.type === "time") {
        expect(step.duration.seconds).toBe(300);
      }
    });

    it("should create a valid workout step with distance duration", () => {
      const step = buildWorkoutStep.build({
        durationType: "distance",
        duration: { type: "distance" as const, meters: 1000 },
      });

      expect(step.stepIndex).toBeGreaterThanOrEqual(0);
      expect(step.durationType).toBe("distance");
      expect(step.duration.type).toBe("distance");
      if (step.duration.type === "distance") {
        expect(step.duration.meters).toBe(1000);
      }
    });

    it("should create a valid workout step with open duration", () => {
      const step = buildWorkoutStep.build({
        durationType: "open",
        duration: { type: "open" as const },
      });

      expect(step.stepIndex).toBeGreaterThanOrEqual(0);
      expect(step.durationType).toBe("open");
      expect(step.duration.type).toBe("open");
    });

    it("should create a valid workout step with power target", () => {
      const step = buildWorkoutStep.build({
        targetType: "power",
        target: {
          type: "power" as const,
          value: { unit: "watts" as const, value: 250 },
        },
      });

      expect(step.targetType).toBe("power");
      expect(step.target.type).toBe("power");
      if (step.target.type === "power" && step.target.value.unit === "watts") {
        expect(step.target.value.value).toBe(250);
      }
    });

    it("should create a valid workout step with heart rate target", () => {
      const step = buildWorkoutStep.build({
        targetType: "heart_rate",
        target: {
          type: "heart_rate" as const,
          value: { unit: "bpm" as const, value: 150 },
        },
      });

      expect(step.targetType).toBe("heart_rate");
      expect(step.target.type).toBe("heart_rate");
      if (
        step.target.type === "heart_rate" &&
        step.target.value.unit === "bpm"
      ) {
        expect(step.target.value.value).toBe(150);
      }
    });
  });

  describe("buildRepetitionBlock", () => {
    it("should create a valid repetition block", () => {
      const block = buildRepetitionBlock.build();

      expect(block.repeatCount).toBeGreaterThanOrEqual(2);
      expect(block.repeatCount).toBeLessThanOrEqual(10);
      expect(block.steps).toHaveLength(2);
      expect(block.steps[0]).toHaveProperty("stepIndex");
      expect(block.steps[0]).toHaveProperty("durationType");
      expect(block.steps[0]).toHaveProperty("duration");
      expect(block.steps[0]).toHaveProperty("targetType");
      expect(block.steps[0]).toHaveProperty("target");
    });

    it("should create a repetition block with custom repeat count", () => {
      const block = buildRepetitionBlock.build({ repeatCount: 5 });

      expect(block.repeatCount).toBe(5);
      expect(block.steps).toHaveLength(2);
    });
  });

  describe("buildWorkout", () => {
    it("should create a valid workout", () => {
      const workout = buildWorkout.build();

      expect(workout.sport).toBeDefined();
      expect(workout.steps).toHaveLength(3);
      expect(workout.name).toBeDefined();
    });

    it("should create a workout with custom sport", () => {
      const workout = buildWorkout.build({ sport: "running" });

      expect(workout.sport).toBe("running");
      expect(workout.steps).toHaveLength(3);
    });

    it("should create a workout without name", () => {
      const workout = buildWorkout.build({ name: undefined });

      expect(workout.name).toBeUndefined();
      expect(workout.sport).toBeDefined();
      expect(workout.steps).toHaveLength(3);
    });
  });
});
