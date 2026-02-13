import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Workout } from "@kaiord/core";
import { createToleranceChecker, isRepetitionBlock } from "@kaiord/core";
import { convertGarminToKRD } from "../converters/garmin-to-krd.converter";
import { convertKRDToGarmin } from "../converters/krd-to-garmin.converter";

const fixturesDir = join(__dirname, "../../../../../test-fixtures/gcn");

const loadFixture = (name: string): string =>
  readFileSync(join(fixturesDir, name), "utf-8");

const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe("Garmin GCN Round-Trip", () => {
  const toleranceChecker = createToleranceChecker();

  it("should preserve running workout through round-trip", () => {
    const original = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

    const krd1 = convertGarminToKRD(original, mockLogger);
    const gcnOutput = convertKRDToGarmin(krd1, mockLogger);
    const krd2 = convertGarminToKRD(gcnOutput, mockLogger);

    const w1 = krd1.extensions?.structured_workout as Workout;
    const w2 = krd2.extensions?.structured_workout as Workout;

    expect(w2.name).toBe(w1.name);
    expect(w2.sport).toBe(w1.sport);
    expect(w2.steps.length).toBe(w1.steps.length);

    compareSteps(w1.steps, w2.steps, toleranceChecker);
  });

  it("should preserve cycling workout through round-trip", () => {
    const original = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");

    const krd1 = convertGarminToKRD(original, mockLogger);
    const gcnOutput = convertKRDToGarmin(krd1, mockLogger);
    const krd2 = convertGarminToKRD(gcnOutput, mockLogger);

    const w1 = krd1.extensions?.structured_workout as Workout;
    const w2 = krd2.extensions?.structured_workout as Workout;

    expect(w2.sport).toBe(w1.sport);
    expect(w2.steps.length).toBe(w1.steps.length);

    compareSteps(w1.steps, w2.steps, toleranceChecker);
  });

  it("should preserve swimming workout pool length through round-trip", () => {
    const original = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");

    const krd1 = convertGarminToKRD(original, mockLogger);
    const gcnOutput = convertKRDToGarmin(krd1, mockLogger);
    const krd2 = convertGarminToKRD(gcnOutput, mockLogger);

    const w1 = krd1.extensions?.structured_workout as Workout;
    const w2 = krd2.extensions?.structured_workout as Workout;

    expect(w2.poolLength).toBe(w1.poolLength);
    expect(w2.poolLengthUnit).toBe(w1.poolLengthUnit);
    expect(w2.steps.length).toBe(w1.steps.length);
  });

  it("should preserve strength workout through round-trip", () => {
    const original = loadFixture("WorkoutStrengthRepsOutput.gcn");

    const krd1 = convertGarminToKRD(original, mockLogger);
    const gcnOutput = convertKRDToGarmin(krd1, mockLogger);
    const krd2 = convertGarminToKRD(gcnOutput, mockLogger);

    const w1 = krd1.extensions?.structured_workout as Workout;
    const w2 = krd2.extensions?.structured_workout as Workout;

    expect(w2.sport).toBe(w1.sport);
    expect(w2.steps.length).toBe(w1.steps.length);
  });

  it("should handle edge cases through round-trip", () => {
    const original = loadFixture("WorkoutEdgeCasesOutput.gcn");

    const krd1 = convertGarminToKRD(original, mockLogger);
    const gcnOutput = convertKRDToGarmin(krd1, mockLogger);
    const krd2 = convertGarminToKRD(gcnOutput, mockLogger);

    const w1 = krd1.extensions?.structured_workout as Workout;
    const w2 = krd2.extensions?.structured_workout as Workout;

    expect(w2.steps.length).toBe(w1.steps.length);
  });

  it("should preserve multisport workout steps through round-trip", () => {
    const original = loadFixture("WorkoutMultisportTriathlonOutput.gcn");

    const krd1 = convertGarminToKRD(original, mockLogger);
    const gcnOutput = convertKRDToGarmin(krd1, mockLogger);
    const krd2 = convertGarminToKRD(gcnOutput, mockLogger);

    const w1 = krd1.extensions?.structured_workout as Workout;
    const w2 = krd2.extensions?.structured_workout as Workout;

    expect(w2.steps.length).toBe(w1.steps.length);
  });
});

type ToleranceChecker = ReturnType<typeof createToleranceChecker>;

const compareSteps = (
  steps1: Array<WorkoutStep | RepetitionBlock>,
  steps2: Array<WorkoutStep | RepetitionBlock>,
  checker: ToleranceChecker
): void => {
  for (let i = 0; i < steps1.length; i++) {
    const s1 = steps1[i];
    const s2 = steps2[i];

    if (isRepetitionBlock(s1) && isRepetitionBlock(s2)) {
      expect(s2.repeatCount).toBe(s1.repeatCount);
      expect(s2.steps.length).toBe(s1.steps.length);
      compareSteps(s1.steps, s2.steps, checker);
    } else if (!isRepetitionBlock(s1) && !isRepetitionBlock(s2)) {
      expect(s2.durationType).toBe(s1.durationType);
      expect(s2.targetType).toBe(s1.targetType);

      if (s1.duration.type === "time" && s2.duration.type === "time") {
        const violation = checker.checkTime(
          s1.duration.seconds,
          s2.duration.seconds
        );
        expect(violation).toBeNull();
      }

      if (s1.duration.type === "distance" && s2.duration.type === "distance") {
        expect(
          Math.abs(s1.duration.meters - s2.duration.meters)
        ).toBeLessThanOrEqual(1);
      }
    }
  }
};
