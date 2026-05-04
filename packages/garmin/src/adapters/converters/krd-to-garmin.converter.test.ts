import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });

      // Act
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.sportType.sportTypeKey).toBe("running");
      expect(parsed.workoutName).toBe("MEGA RUN - Complete API Test");
      expect(parsed.workoutSegments).toHaveLength(1);
      expect(parsed.workoutSegments[0].workoutSteps.length).toBeGreaterThan(0);
    });

    it("should produce sequential stepOrder values", () => {
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });
      const parsed = JSON.parse(result);

      // Act
      const flatSteps = getAllStepOrders(
        parsed.workoutSegments[0].workoutSteps
      );

      // Assert
      for (let i = 0; i < flatSteps.length - 1; i++) {
        expect(flatSteps[i + 1]).toBe(flatSteps[i] + 1);
      }
    });
  });

  describe("cycling workout", () => {
    it("should preserve power targets", () => {
      // Arrange
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });
      const parsed = JSON.parse(result);
      const steps = parsed.workoutSegments[0].workoutSteps;

      // Act
      const warmup = steps[0];

      // Assert
      expect(warmup.targetType.workoutTargetTypeKey).toBe("power.zone");
      expect(warmup.zoneNumber).toBe(2);
    });

    it("should preserve cadence targets", () => {
      // Arrange
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });
      const parsed = JSON.parse(result);
      const steps = parsed.workoutSegments[0].workoutSteps;

      // Act
      const cadenceStep = steps.find(
        (s: Record<string, unknown>) =>
          s.type === "ExecutableStepDTO" &&
          (s.targetType as Record<string, unknown>).workoutTargetTypeKey ===
            "cadence"
      );

      // Assert
      expect(cadenceStep).toBeDefined();
      expect(cadenceStep.targetValueOne).toBe(95);
      expect(cadenceStep.targetValueTwo).toBe(105);
    });
  });

  describe("swimming workout", () => {
    it("should preserve pool length", () => {
      // Arrange
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });

      // Act
      const parsed = JSON.parse(result);

      // Assert
      expect(parsed.poolLength).toBe(25);
      expect(parsed.poolLengthUnit.unitKey).toBe("meter");
    });
  });

  describe("strength workout", () => {
    it("should produce repeat blocks for strength sets", () => {
      // Arrange
      const gcn = loadFixture("WorkoutStrengthRepsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });
      const parsed = JSON.parse(result);
      const steps = parsed.workoutSegments[0].workoutSteps;

      // Act
      const repeatStep = steps.find(
        (s: Record<string, unknown>) => s.type === "RepeatGroupDTO"
      );

      // Assert
      expect(repeatStep).toBeDefined();
      expect(repeatStep.numberOfIterations).toBe(3);
    });
  });

  describe("step description round-trip", () => {
    it("should preserve step descriptions through GCN → KRD → GCN", () => {
      // Arrange
      const gcnInput = JSON.stringify({
        sportType: { sportTypeId: 2, sportTypeKey: "cycling" },
        workoutName: "Notes Test",
        workoutSegments: [
          {
            segmentOrder: 1,
            sportType: { sportTypeId: 2, sportTypeKey: "cycling" },
            workoutSteps: [
              {
                type: "ExecutableStepDTO",
                stepOrder: 1,
                stepType: { stepTypeId: 1, stepTypeKey: "warmup" },
                endCondition: {
                  conditionTypeId: 2,
                  conditionTypeKey: "time",
                  displayable: true,
                },
                endConditionValue: 300,
                targetType: {
                  workoutTargetTypeId: 1,
                  workoutTargetTypeKey: "no.target",
                },
                description: "5 min easy Z1",
              },
              {
                type: "ExecutableStepDTO",
                stepOrder: 2,
                stepType: { stepTypeId: 2, stepTypeKey: "cooldown" },
                endCondition: {
                  conditionTypeId: 2,
                  conditionTypeKey: "time",
                  displayable: true,
                },
                endConditionValue: 300,
                targetType: {
                  workoutTargetTypeId: 1,
                  workoutTargetTypeKey: "no.target",
                },
                description: "RPE 3 cool-down",
              },
            ],
          },
        ],
      });
      const krd = convertGarminToKRD(gcnInput, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });
      const parsed = JSON.parse(result);

      // Act
      const steps = parsed.workoutSegments[0].workoutSteps;

      // Assert
      expect(steps[0].description).toBe("5 min easy Z1");
      expect(steps[1].description).toBe("RPE 3 cool-down");
    });

    it("should omit description when step has no notes", () => {
      // Arrange
      const gcnInput = JSON.stringify({
        sportType: { sportTypeId: 1, sportTypeKey: "running" },
        workoutName: "No Notes",
        workoutSegments: [
          {
            segmentOrder: 1,
            sportType: { sportTypeId: 1, sportTypeKey: "running" },
            workoutSteps: [
              {
                type: "ExecutableStepDTO",
                stepOrder: 1,
                stepType: { stepTypeId: 1, stepTypeKey: "warmup" },
                endCondition: {
                  conditionTypeId: 2,
                  conditionTypeKey: "time",
                  displayable: true,
                },
                endConditionValue: 600,
                targetType: {
                  workoutTargetTypeId: 1,
                  workoutTargetTypeKey: "no.target",
                },
              },
            ],
          },
        ],
      });
      const krd = convertGarminToKRD(gcnInput, mockLogger);
      const result = convertKRDToGarmin(krd, { logger: mockLogger });
      const parsed = JSON.parse(result);

      // Act
      const step = parsed.workoutSegments[0].workoutSteps[0];

      // Assert
      expect(step.description).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should throw when KRD has no workout extension", () => {
      // Arrange

      // Act
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: new Date().toISOString(),
          sport: "running",
        },
      };

      // Assert
      expect(() => convertKRDToGarmin(krd, { logger: mockLogger })).toThrow();
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
