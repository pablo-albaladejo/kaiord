import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { KRD } from "../../../domain/schemas/krd";
import { createToleranceChecker } from "../../../domain/validation/tolerance-checker";
import { createMockLogger } from "../../../tests/helpers/test-utils";
import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "../fast-xml-parser";
import { createXsdTcxValidator } from "../xsd-validator";

describe("Round-trip: TCX → KRD → TCX", () => {
  it("should preserve heart rate targets through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdTcxValidator(logger);
    const reader = createFastXmlTcxReader(logger);
    const writer = createFastXmlTcxWriter(logger, validator);
    const toleranceChecker = createToleranceChecker();
    const tcxPath = join(
      __dirname,
      "../../../tests/fixtures/tcx-files/WorkoutHeartRateTargets.tcx"
    );
    const originalXml = readFileSync(tcxPath, "utf-8");

    // Act - TCX → KRD → TCX → KRD
    const krd1 = await reader(originalXml);
    const convertedXml = await writer(krd1);
    const krd2 = await reader(convertedXml);

    // Assert - Compare workout structures
    const workout1 = krd1.extensions?.workout as {
      name?: string;
      sport: string;
      steps: Array<{
        stepIndex: number;
        targetType: string;
        target: {
          type: string;
          value: { unit: string; value?: number; min?: number; max?: number };
        };
      }>;
    };

    const workout2 = krd2.extensions?.workout as {
      name?: string;
      sport: string;
      steps: Array<{
        stepIndex: number;
        targetType: string;
        target: {
          type: string;
          value: { unit: string; value?: number; min?: number; max?: number };
        };
      }>;
    };

    expect(workout2.name).toBe(workout1.name);
    expect(workout2.sport).toBe(workout1.sport);
    expect(workout2.steps.length).toBe(workout1.steps.length);

    // Check heart rate targets with tolerance
    for (let i = 0; i < workout1.steps.length; i++) {
      const step1 = workout1.steps[i];
      const step2 = workout2.steps[i];

      if (step1.targetType === "heart_rate") {
        expect(step2.targetType).toBe("heart_rate");

        if (step1.target.value.unit === "range") {
          if (step1.target.value.min !== undefined) {
            expect(step2.target.value.min).toBeDefined();
            const violation = toleranceChecker.checkHeartRate(
              step1.target.value.min,
              step2.target.value.min!
            );
            expect(violation).toBeNull();
          }

          if (step1.target.value.max !== undefined) {
            expect(step2.target.value.max).toBeDefined();
            const violation = toleranceChecker.checkHeartRate(
              step1.target.value.max,
              step2.target.value.max!
            );
            expect(violation).toBeNull();
          }
        }
      }
    }
  });

  it("should preserve speed/pace targets through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdTcxValidator(logger);
    const reader = createFastXmlTcxReader(logger);
    const writer = createFastXmlTcxWriter(logger, validator);
    const toleranceChecker = createToleranceChecker();
    const tcxPath = join(
      __dirname,
      "../../../tests/fixtures/tcx-files/WorkoutSpeedTargets.tcx"
    );
    const originalXml = readFileSync(tcxPath, "utf-8");

    // Act - TCX → KRD → TCX → KRD
    const krd1 = await reader(originalXml);
    const convertedXml = await writer(krd1);
    const krd2 = await reader(convertedXml);

    // Assert - Check pace targets with tolerance
    const workout1 = krd1.extensions?.workout as {
      steps: Array<{
        durationType: string;
        duration: { type: string; meters?: number };
        target: {
          type: string;
          value?: { unit: string; min?: number; max?: number };
        };
      }>;
    };

    const workout2 = krd2.extensions?.workout as {
      steps: Array<{
        durationType: string;
        duration: { type: string; meters?: number };
        target: {
          type: string;
          value?: { unit: string; min?: number; max?: number };
        };
      }>;
    };

    for (let i = 0; i < workout1.steps.length; i++) {
      const step1 = workout1.steps[i];
      const step2 = workout2.steps[i];

      // Check distance durations
      if (
        step1.durationType === "distance" &&
        step1.duration.meters !== undefined
      ) {
        const violation = toleranceChecker.checkDistance(
          step1.duration.meters,
          step2.duration.meters!
        );
        expect(violation).toBeNull();
      }

      // Check pace targets
      if (
        step1.target.type === "pace" &&
        step1.target.value?.unit === "range"
      ) {
        if (step1.target.value.min !== undefined) {
          const violation = toleranceChecker.checkPace(
            step1.target.value.min,
            step2.target.value!.min!
          );
          expect(violation).toBeNull();
        }

        if (step1.target.value.max !== undefined) {
          const violation = toleranceChecker.checkPace(
            step1.target.value.max,
            step2.target.value!.max!
          );
          expect(violation).toBeNull();
        }
      }
    }
  });

  it("should preserve repetition blocks through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdTcxValidator(logger);
    const reader = createFastXmlTcxReader(logger);
    const writer = createFastXmlTcxWriter(logger, validator);
    const tcxPath = join(
      __dirname,
      "../../../tests/fixtures/tcx-files/WorkoutRepeatBlocks.tcx"
    );
    const originalXml = readFileSync(tcxPath, "utf-8");

    // Act - TCX → KRD → TCX → KRD
    const krd1 = await reader(originalXml);
    const convertedXml = await writer(krd1);
    const krd2 = await reader(convertedXml);

    // Assert - Check repetition blocks
    const workout1 = krd1.extensions?.workout as {
      steps: Array<
        | { stepIndex: number }
        | {
            repeatCount: number;
            steps: Array<{
              stepIndex: number;
              durationType: string;
              targetType: string;
            }>;
          }
      >;
    };

    const workout2 = krd2.extensions?.workout as {
      steps: Array<
        | { stepIndex: number }
        | {
            repeatCount: number;
            steps: Array<{
              stepIndex: number;
              durationType: string;
              targetType: string;
            }>;
          }
      >;
    };

    expect(workout2.steps.length).toBe(workout1.steps.length);

    // Find and compare repetition blocks
    for (let i = 0; i < workout1.steps.length; i++) {
      const step1 = workout1.steps[i];
      const step2 = workout2.steps[i];

      if ("repeatCount" in step1 && "repeatCount" in step2) {
        expect(step2.repeatCount).toBe(step1.repeatCount);
        expect(step2.steps.length).toBe(step1.steps.length);

        // Check nested steps
        for (let j = 0; j < step1.steps.length; j++) {
          expect(step2.steps[j].durationType).toBe(step1.steps[j].durationType);
          expect(step2.steps[j].targetType).toBe(step1.steps[j].targetType);
        }
      }
    }
  });

  it("should preserve mixed duration types through round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdTcxValidator(logger);
    const reader = createFastXmlTcxReader(logger);
    const writer = createFastXmlTcxWriter(logger, validator);
    const toleranceChecker = createToleranceChecker();
    const tcxPath = join(
      __dirname,
      "../../../tests/fixtures/tcx-files/WorkoutMixedDurations.tcx"
    );
    const originalXml = readFileSync(tcxPath, "utf-8");

    // Act - TCX → KRD → TCX → KRD
    const krd1 = await reader(originalXml);
    const convertedXml = await writer(krd1);
    const krd2 = await reader(convertedXml);

    // Assert - Check all duration types
    const workout1 = krd1.extensions?.workout as {
      steps: Array<{
        durationType: string;
        duration: {
          type: string;
          seconds?: number;
          meters?: number;
          bpm?: number;
          calories?: number;
        };
        target: {
          type: string;
          value?: { unit: string; min?: number; max?: number };
        };
      }>;
    };

    const workout2 = krd2.extensions?.workout as {
      steps: Array<{
        durationType: string;
        duration: {
          type: string;
          seconds?: number;
          meters?: number;
          bpm?: number;
          calories?: number;
        };
        target: {
          type: string;
          value?: { unit: string; min?: number; max?: number };
        };
      }>;
    };

    expect(workout2.steps.length).toBe(workout1.steps.length);

    for (let i = 0; i < workout1.steps.length; i++) {
      const step1 = workout1.steps[i];
      const step2 = workout2.steps[i];

      // Check duration type preserved
      expect(step2.durationType).toBe(step1.durationType);

      // Check time durations with tolerance
      if (step1.duration.seconds !== undefined) {
        const violation = toleranceChecker.checkTime(
          step1.duration.seconds,
          step2.duration.seconds!
        );
        expect(violation).toBeNull();
      }

      // Check distance durations with tolerance
      if (step1.duration.meters !== undefined) {
        const violation = toleranceChecker.checkDistance(
          step1.duration.meters,
          step2.duration.meters!
        );
        expect(violation).toBeNull();
      }

      // Check extensions preserved (calories, HR conditionals)
      if (step1.duration.calories !== undefined) {
        expect(step2.duration.calories).toBe(step1.duration.calories);
      }

      if (step1.duration.bpm !== undefined) {
        expect(step2.duration.bpm).toBe(step1.duration.bpm);
      }

      // Check cadence targets with tolerance
      if (
        step1.target.type === "cadence" &&
        step1.target.value?.unit === "range"
      ) {
        if (step1.target.value.min !== undefined) {
          const violation = toleranceChecker.checkCadence(
            step1.target.value.min,
            step2.target.value!.min!
          );
          expect(violation).toBeNull();
        }

        if (step1.target.value.max !== undefined) {
          const violation = toleranceChecker.checkCadence(
            step1.target.value.max,
            step2.target.value!.max!
          );
          expect(violation).toBeNull();
        }
      }
    }
  });
});

describe("Round-trip: KRD → TCX → KRD", () => {
  it("should preserve workout structure through KRD → TCX → KRD", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdTcxValidator(logger);
    const reader = createFastXmlTcxReader(logger);
    const writer = createFastXmlTcxWriter(logger, validator);
    const toleranceChecker = createToleranceChecker();

    const originalKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "heart_rate",
              target: {
                type: "heart_rate",
                value: { unit: "zone", value: 2 },
              },
              intensity: "warmup",
            },
            {
              stepIndex: 1,
              durationType: "distance",
              duration: { type: "distance", meters: 1600 },
              targetType: "heart_rate",
              target: {
                type: "heart_rate",
                value: { unit: "range", min: 140, max: 160 },
              },
              intensity: "active",
            },
            {
              stepIndex: 2,
              durationType: "open",
              duration: { type: "open" },
              targetType: "open",
              target: { type: "open" },
              intensity: "cooldown",
            },
          ],
        },
      },
    };

    // Act - KRD → TCX → KRD
    const tcxXml = await writer(originalKrd);
    const convertedKrd = await reader(tcxXml);

    // Assert - Compare structures
    expect(convertedKrd.version).toBe(originalKrd.version);
    expect(convertedKrd.type).toBe(originalKrd.type);
    expect(convertedKrd.metadata.sport).toBe(originalKrd.metadata.sport);

    const originalWorkout = originalKrd.extensions?.workout as {
      name?: string;
      sport: string;
      steps: Array<{
        stepIndex: number;
        durationType: string;
        duration: { type: string; seconds?: number; meters?: number };
        targetType: string;
        target: {
          type: string;
          value?: { unit: string; value?: number; min?: number; max?: number };
        };
        intensity?: string;
      }>;
    };

    const convertedWorkout = convertedKrd.extensions?.workout as {
      name?: string;
      sport: string;
      steps: Array<{
        stepIndex: number;
        durationType: string;
        duration: { type: string; seconds?: number; meters?: number };
        targetType: string;
        target: {
          type: string;
          value?: { unit: string; value?: number; min?: number; max?: number };
        };
        intensity?: string;
      }>;
    };

    expect(convertedWorkout.name).toBe(originalWorkout.name);
    expect(convertedWorkout.sport).toBe(originalWorkout.sport);
    expect(convertedWorkout.steps.length).toBe(originalWorkout.steps.length);

    // Check each step with tolerance
    for (let i = 0; i < originalWorkout.steps.length; i++) {
      const originalStep = originalWorkout.steps[i];
      const convertedStep = convertedWorkout.steps[i];

      expect(convertedStep.durationType).toBe(originalStep.durationType);
      expect(convertedStep.targetType).toBe(originalStep.targetType);
      expect(convertedStep.intensity).toBe(originalStep.intensity);

      // Check duration values with tolerance
      if (originalStep.duration.seconds !== undefined) {
        const violation = toleranceChecker.checkTime(
          originalStep.duration.seconds,
          convertedStep.duration.seconds!
        );
        expect(violation).toBeNull();
      }

      if (originalStep.duration.meters !== undefined) {
        const violation = toleranceChecker.checkDistance(
          originalStep.duration.meters,
          convertedStep.duration.meters!
        );
        expect(violation).toBeNull();
      }

      // Check target values with tolerance
      if (
        originalStep.target.value?.unit === "range" &&
        convertedStep.target.value?.unit === "range"
      ) {
        if (originalStep.target.value.min !== undefined) {
          // Use appropriate tolerance checker based on target type
          const checker =
            originalStep.targetType === "heart_rate"
              ? toleranceChecker.checkHeartRate
              : toleranceChecker.checkPace;
          const violation = checker(
            originalStep.target.value.min,
            convertedStep.target.value.min!
          );
          expect(violation).toBeNull();
        }

        if (originalStep.target.value.max !== undefined) {
          const checker =
            originalStep.targetType === "heart_rate"
              ? toleranceChecker.checkHeartRate
              : toleranceChecker.checkPace;
          const violation = checker(
            originalStep.target.value.max,
            convertedStep.target.value.max!
          );
          expect(violation).toBeNull();
        }
      }
    }
  });

  it("should validate generated TCX against XSD schema", async () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createXsdTcxValidator(logger);
    const writer = createFastXmlTcxWriter(logger, validator);

    const krd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Valid Test",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
              intensity: "active",
            },
          ],
        },
      },
    };

    // Act - KRD → TCX (writer validates internally)
    const tcxXml = await writer(krd);

    // Assert - Validate again explicitly
    const validationResult = await validator(tcxXml);
    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
  });
});
