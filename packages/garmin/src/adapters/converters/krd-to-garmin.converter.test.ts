import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { convertGarminToKRD } from "./garmin-to-krd.converter";
import { convertKRDToGarmin } from "./krd-to-garmin.converter";

const fixturesDir = join(__dirname, "../../../../../test-fixtures/gcn");

const loadFixture = (name: string): string =>
  readFileSync(join(fixturesDir, name), "utf-8");

const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe("convertKRDToGarmin", () => {
  describe("running workout", () => {
    it("should produce valid Garmin JSON structure", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      const result = convertKRDToGarmin(krd, mockLogger);
      const parsed = JSON.parse(result);

      expect(parsed.sportType.sportTypeKey).toBe("running");
      expect(parsed.workoutName).toBe("MEGA RUN - Complete API Test");
      expect(parsed.workoutSegments).toHaveLength(1);
      expect(parsed.workoutSegments[0].workoutSteps.length).toBeGreaterThan(0);
    });

    it("should produce sequential stepOrder values", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      const result = convertKRDToGarmin(krd, mockLogger);
      const parsed = JSON.parse(result);

      const flatSteps = getAllStepOrders(
        parsed.workoutSegments[0].workoutSteps
      );
      for (let i = 0; i < flatSteps.length - 1; i++) {
        expect(flatSteps[i + 1]).toBe(flatSteps[i] + 1);
      }
    });
  });

  describe("cycling workout", () => {
    it("should preserve power targets", () => {
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      const result = convertKRDToGarmin(krd, mockLogger);
      const parsed = JSON.parse(result);
      const steps = parsed.workoutSegments[0].workoutSteps;

      // First step should have power zone
      const warmup = steps[0];
      expect(warmup.targetType.workoutTargetTypeKey).toBe("power.zone");
      expect(warmup.zoneNumber).toBe(2);
    });

    it("should preserve cadence targets", () => {
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      const result = convertKRDToGarmin(krd, mockLogger);
      const parsed = JSON.parse(result);
      const steps = parsed.workoutSegments[0].workoutSteps;

      // Find cadence step (after repeat block)
      const cadenceStep = steps.find(
        (s: Record<string, unknown>) =>
          s.type === "ExecutableStepDTO" &&
          (s.targetType as Record<string, unknown>).workoutTargetTypeKey ===
            "cadence"
      );
      expect(cadenceStep).toBeDefined();
      expect(cadenceStep.targetValueOne).toBe(95);
      expect(cadenceStep.targetValueTwo).toBe(105);
    });
  });

  describe("swimming workout", () => {
    it("should preserve pool length", () => {
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      const result = convertKRDToGarmin(krd, mockLogger);
      const parsed = JSON.parse(result);

      expect(parsed.poolLength).toBe(25);
      expect(parsed.poolLengthUnit.unitKey).toBe("meter");
    });
  });

  describe("strength workout", () => {
    it("should produce repeat blocks for strength sets", () => {
      const gcn = loadFixture("WorkoutStrengthRepsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      const result = convertKRDToGarmin(krd, mockLogger);
      const parsed = JSON.parse(result);
      const steps = parsed.workoutSegments[0].workoutSteps;

      const repeatStep = steps.find(
        (s: Record<string, unknown>) => s.type === "RepeatGroupDTO"
      );
      expect(repeatStep).toBeDefined();
      expect(repeatStep.numberOfIterations).toBe(3);
    });
  });

  describe("error handling", () => {
    it("should throw when KRD has no workout extension", () => {
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: new Date().toISOString(),
          sport: "running",
        },
      };

      expect(() => convertKRDToGarmin(krd, mockLogger)).toThrow();
    });
  });
});

const getAllStepOrders = (steps: Array<Record<string, unknown>>): number[] => {
  const orders: number[] = [];
  for (const step of steps) {
    orders.push(step.stepOrder as number);
    if (step.workoutSteps) {
      orders.push(
        ...getAllStepOrders(step.workoutSteps as Array<Record<string, unknown>>)
      );
    }
  }
  return orders;
};
