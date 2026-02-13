import { describe, expect, it } from "vitest";
import type { ParsedExecutableStep } from "../schemas/garmin-workout-parse.schema";
import { mapExecutableStep } from "./executable-step.converter";

const buildStep = (
  overrides?: Partial<ParsedExecutableStep>
): ParsedExecutableStep => ({
  type: "ExecutableStepDTO",
  stepType: { stepTypeKey: "interval" },
  endCondition: { conditionTypeKey: "time" },
  endConditionValue: 300,
  targetType: { workoutTargetTypeKey: "no.target" },
  ...overrides,
});

describe("mapExecutableStep", () => {
  describe("duration mapping", () => {
    it("should map time condition to time duration", () => {
      const step = buildStep({
        endCondition: { conditionTypeKey: "time" },
        endConditionValue: 600,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.durationType).toBe("time");
      expect(result.duration).toStrictEqual({ type: "time", seconds: 600 });
    });

    it("should map distance condition to distance duration", () => {
      const step = buildStep({
        endCondition: { conditionTypeKey: "distance" },
        endConditionValue: 1000,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.durationType).toBe("distance");
      expect(result.duration).toStrictEqual({
        type: "distance",
        meters: 1000,
      });
    });

    it("should map calories condition to calories duration", () => {
      const step = buildStep({
        endCondition: { conditionTypeKey: "calories" },
        endConditionValue: 500,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.durationType).toBe("calories");
      expect(result.duration).toStrictEqual({
        type: "calories",
        calories: 500,
      });
    });

    it("should map lap.button condition to open duration", () => {
      const step = buildStep({
        endCondition: { conditionTypeKey: "lap.button" },
        endConditionValue: 0,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.durationType).toBe("open");
      expect(result.duration).toStrictEqual({ type: "open" });
    });
  });

  describe("intensity mapping", () => {
    it("should map warmup step type to warmup intensity", () => {
      const step = buildStep({
        stepType: { stepTypeKey: "warmup" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.intensity).toBe("warmup");
    });

    it("should map cooldown step type to cooldown intensity", () => {
      const step = buildStep({
        stepType: { stepTypeKey: "cooldown" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.intensity).toBe("cooldown");
    });

    it("should map interval step type to active intensity", () => {
      const step = buildStep({
        stepType: { stepTypeKey: "interval" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.intensity).toBe("active");
    });

    it("should map recovery step type to recovery intensity", () => {
      const step = buildStep({
        stepType: { stepTypeKey: "recovery" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.intensity).toBe("recovery");
    });

    it("should map rest step type to rest intensity", () => {
      const step = buildStep({
        stepType: { stepTypeKey: "rest" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.intensity).toBe("rest");
    });
  });

  describe("target mapping", () => {
    it("should map no.target to open target", () => {
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "no.target" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("open");
      expect(result.target).toStrictEqual({ type: "open" });
    });

    it("should map power.zone target with zone number", () => {
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "power.zone" },
        zoneNumber: 3,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should map power.zone target with range values", () => {
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "power.zone" },
        targetValueOne: 200,
        targetValueTwo: 250,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      });
    });

    it("should map heart.rate.zone target with zone number", () => {
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "heart.rate.zone" },
        zoneNumber: 4,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("heart_rate");
      expect(result.target).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      });
    });

    it("should map cadence target with range values", () => {
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "cadence" },
        targetValueOne: 80,
        targetValueTwo: 100,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("cadence");
      expect(result.target).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });
  });

  describe("secondary target", () => {
    it("should use secondary target when primary is open", () => {
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "no.target" },
        secondaryTargetType: { workoutTargetTypeKey: "power.zone" },
        secondaryTargetValueOne: 180,
        secondaryTargetValueTwo: 220,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 180, max: 220 },
      });
    });

    it("should not use secondary target when primary is defined", () => {
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "power.zone" },
        zoneNumber: 3,
        secondaryTargetType: { workoutTargetTypeKey: "heart.rate.zone" },
        secondaryZoneNumber: 4,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 3 },
      });
    });
  });

  describe("equipment mapping", () => {
    it("should include equipment when equipmentType is present", () => {
      const step = buildStep({
        equipmentType: { equipmentTypeKey: "fins" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.equipment).toBe("swim_fins");
    });

    it("should not include equipment when equipmentType is null", () => {
      const step = buildStep({
        equipmentType: null,
      });

      const result = mapExecutableStep(step, 0);

      expect(result.equipment).toBeUndefined();
    });

    it("should not include equipment when equipmentType is absent", () => {
      const step = buildStep();

      const result = mapExecutableStep(step, 0);

      expect(result.equipment).toBeUndefined();
    });
  });

  describe("stroke mapping", () => {
    it("should override target with stroke_type when stroke is present", () => {
      const step = buildStep({
        strokeType: { strokeTypeKey: "free", strokeTypeId: 6 },
        targetType: { workoutTargetTypeKey: "no.target" },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("stroke_type");
      expect(result.target).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 0 },
      });
    });

    it("should not set stroke target when strokeType has id 0", () => {
      const step = buildStep({
        strokeType: { strokeTypeKey: "free", strokeTypeId: 0 },
      });

      const result = mapExecutableStep(step, 0);

      // strokeTypeId 0 means mapGarminStrokeToKrd returns undefined
      expect(result.targetType).toBe("open");
    });

    it("should not set stroke target when strokeTypeKey is null", () => {
      const step = buildStep({
        strokeType: { strokeTypeKey: null, strokeTypeId: 6 },
      });

      const result = mapExecutableStep(step, 0);

      expect(result.targetType).toBe("open");
    });
  });

  describe("stepIndex", () => {
    it("should assign the provided stepIndex", () => {
      const step = buildStep();

      const result = mapExecutableStep(step, 5);

      expect(result.stepIndex).toBe(5);
    });
  });
});
