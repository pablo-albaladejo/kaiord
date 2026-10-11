import type {
  RepetitionBlock,
  ToleranceChecker,
  WorkoutStep,
} from "@kaiord/core";
import { createToleranceChecker, extractWorkout } from "@kaiord/core";
import {
  createMockLogger,
  loadFitFixture,
  loadTcxFixture,
} from "@kaiord/core/test-utils";
import { createFitReader, createFitWriter } from "@kaiord/fit";
import { createTcxReader, createTcxWriter } from "@kaiord/tcx";
import { describe, expect, it } from "vitest";

const flattenSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep> =>
  steps.flatMap((step) => ("repeatCount" in step ? step.steps : [step]));

const repeatShape = (steps: Array<WorkoutStep | RepetitionBlock>) =>
  steps.map((step) =>
    "repeatCount" in step
      ? {
          repeatCount: step.repeatCount,
          steps: step.steps.map((child) => child.duration),
        }
      : step.duration
  );

const TCX_REPEAT_BLOCK = {
  repeatCount: 5,
  steps: [
    { type: "time", seconds: 240 },
    { type: "time", seconds: 120 },
  ],
};

const TARGET_CHECKERS = {
  heart_rate: { scalar: "bpm", check: "checkHeartRate" },
  cadence: { scalar: "rpm", check: "checkCadence" },
  pace: { scalar: "mps", check: "checkPace" },
} as const;

const assertTargetWithinTolerance = (
  a: WorkoutStep["target"],
  b: WorkoutStep["target"],
  checker: ToleranceChecker
): void => {
  if (a.type !== b.type) return;
  if (a.type !== "heart_rate" && a.type !== "cadence" && a.type !== "pace") {
    return;
  }
  const spec = TARGET_CHECKERS[a.type];
  const check = checker[spec.check];
  const va = a.value as {
    unit: string;
    value?: number;
    min?: number;
    max?: number;
  };
  const vb = b.value as {
    unit: string;
    value?: number;
    min?: number;
    max?: number;
  };
  if (va.unit !== vb.unit) return;
  if (va.unit === "range") {
    if (va.min !== undefined && vb.min !== undefined) {
      expect(check(va.min, vb.min)).toBeNull();
    }
    if (va.max !== undefined && vb.max !== undefined) {
      expect(check(va.max, vb.max)).toBeNull();
    }
  } else if (
    va.unit === spec.scalar &&
    va.value !== undefined &&
    vb.value !== undefined
  ) {
    expect(check(va.value, vb.value)).toBeNull();
  }
};

describe("Cross-format round-trip: FIT → KRD → TCX → KRD", () => {
  it("should preserve workout structure across the KRD intermediate representation", async () => {
    // Arrange
    const logger = createMockLogger();
    const fitReader = createFitReader(logger);
    const tcxWriter = createTcxWriter(logger);
    const tcxReader = createTcxReader(logger);
    const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const krdFromFit = await fitReader(fitBuffer);
    const tcxXml = await tcxWriter(krdFromFit);
    const krdFromTcx = await tcxReader(tcxXml);

    // Assert
    const workoutA = extractWorkout(krdFromFit);
    const workoutB = extractWorkout(krdFromTcx);
    const stepsA = flattenSteps(workoutA.steps);
    const stepsB = flattenSteps(workoutB.steps);
    expect(stepsA.length).toBeGreaterThan(0);
    expect(stepsB.length).toBe(stepsA.length);
    expect(stepsB.map((s) => s.durationType)).toStrictEqual(
      stepsA.map((s) => s.durationType)
    );
  });

  it("should keep time and distance durations within round-trip tolerances", async () => {
    // Arrange
    const logger = createMockLogger();
    const fitReader = createFitReader(logger);
    const tcxWriter = createTcxWriter(logger);
    const tcxReader = createTcxReader(logger);
    const toleranceChecker = createToleranceChecker();
    const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const krdFromFit = await fitReader(fitBuffer);
    const tcxXml = await tcxWriter(krdFromFit);
    const krdFromTcx = await tcxReader(tcxXml);

    // Assert
    const stepsA = flattenSteps(extractWorkout(krdFromFit).steps);
    const stepsB = flattenSteps(extractWorkout(krdFromTcx).steps);
    for (let i = 0; i < stepsA.length; i++) {
      const durationA = stepsA[i].duration;
      const durationB = stepsB[i].duration;
      if (durationA.type === "time" && durationB.type === "time") {
        const violation = toleranceChecker.checkTime(
          durationA.seconds,
          durationB.seconds
        );
        expect(violation).toBeNull();
      }
      if (durationA.type === "distance" && durationB.type === "distance") {
        expect(
          Math.abs(durationA.meters - durationB.meters)
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it("should preserve target types for targets representable in TCX", async () => {
    // Arrange
    const logger = createMockLogger();
    const fitReader = createFitReader(logger);
    const tcxWriter = createTcxWriter(logger);
    const tcxReader = createTcxReader(logger);
    const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const krdFromFit = await fitReader(fitBuffer);
    const tcxXml = await tcxWriter(krdFromFit);
    const krdFromTcx = await tcxReader(tcxXml);

    // Assert
    const stepsA = flattenSteps(extractWorkout(krdFromFit).steps);
    const stepsB = flattenSteps(extractWorkout(krdFromTcx).steps);
    const tcxRepresentable = new Set(["heart_rate", "pace", "cadence"]);
    for (let i = 0; i < stepsA.length; i++) {
      if (tcxRepresentable.has(stepsA[i].targetType)) {
        expect(stepsB[i].targetType).toBe(stepsA[i].targetType);
      }
    }
  });

  it("should serialize FIT repeat blocks to a TCX Repeat_t without throwing", async () => {
    // Arrange
    const logger = createMockLogger();
    const fitReader = createFitReader(logger);
    const tcxWriter = createTcxWriter(logger);
    const fitBuffer = loadFitFixture("WorkoutRepeatSteps.fit");

    // Act
    const krdFromFit = await fitReader(fitBuffer);
    const tcxXml = await tcxWriter(krdFromFit);

    // Assert
    const repeatBlock = extractWorkout(krdFromFit).steps.find(
      (step): step is RepetitionBlock => "repeatCount" in step
    );
    expect(repeatBlock).toBeDefined();
    expect(tcxXml).toContain('xsi:type="Repeat_t"');
    expect(tcxXml).toContain(
      `<Repetitions>${repeatBlock?.repeatCount}</Repetitions>`
    );
  });

  it("should read FIT repeat blocks back from TCX with count and children intact", async () => {
    // Arrange
    const logger = createMockLogger();
    const fitReader = createFitReader(logger);
    const tcxWriter = createTcxWriter(logger);
    const tcxReader = createTcxReader(logger);
    const fitBuffer = loadFitFixture("WorkoutRepeatSteps.fit");

    // Act
    const krdFromFit = await fitReader(fitBuffer);
    const krdFromTcx = await tcxReader(await tcxWriter(krdFromFit));

    // Assert
    const shapeA = repeatShape(extractWorkout(krdFromFit).steps);
    expect(shapeA.some((step) => "repeatCount" in step)).toBe(true);
    expect(repeatShape(extractWorkout(krdFromTcx).steps)).toStrictEqual(shapeA);
  });

  it("should keep representable target values within round-trip tolerances", async () => {
    // Arrange
    const logger = createMockLogger();
    const fitReader = createFitReader(logger);
    const tcxWriter = createTcxWriter(logger);
    const tcxReader = createTcxReader(logger);
    const toleranceChecker = createToleranceChecker();
    const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const krdFromFit = await fitReader(fitBuffer);
    const tcxXml = await tcxWriter(krdFromFit);
    const krdFromTcx = await tcxReader(tcxXml);

    // Assert
    const stepsA = flattenSteps(extractWorkout(krdFromFit).steps);
    const stepsB = flattenSteps(extractWorkout(krdFromTcx).steps);
    for (let i = 0; i < stepsA.length; i++) {
      const stepA = stepsA[i];
      const stepB = stepsB[i];
      if (!stepA || !stepB) continue;
      assertTargetWithinTolerance(stepA.target, stepB.target, toleranceChecker);
    }
  });
});

describe("Cross-format round-trip: TCX → KRD → FIT → KRD", () => {
  it("should carry TCX repeat blocks through FIT and back", async () => {
    // Arrange
    const logger = createMockLogger();
    const tcxReader = createTcxReader(logger);
    const fitWriter = createFitWriter(logger);
    const fitReader = createFitReader(logger);
    const tcxXml = loadTcxFixture("WorkoutRepeatBlocks.tcx");

    // Act
    const krdFromTcx = await tcxReader(tcxXml);
    const krdFromFit = await fitReader(await fitWriter(krdFromTcx));

    // Assert
    const shapeA = repeatShape(extractWorkout(krdFromTcx).steps);
    expect(shapeA[1]).toStrictEqual(TCX_REPEAT_BLOCK);
    expect(repeatShape(extractWorkout(krdFromFit).steps)).toStrictEqual(shapeA);
  });
});
