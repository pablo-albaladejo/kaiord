import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { createToleranceChecker, extractWorkout } from "@kaiord/core";
import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { createFitReader } from "@kaiord/fit";
import { createTcxReader, createTcxWriter } from "@kaiord/tcx";
import { describe, expect, it } from "vitest";

const flattenSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep> =>
  steps.flatMap((step) => ("repeatCount" in step ? step.steps : [step]));

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
});
