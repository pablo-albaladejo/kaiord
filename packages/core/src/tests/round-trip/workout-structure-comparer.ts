import { expect } from "vitest";
import type { KRD } from "../../domain/schemas/krd";
import type { ToleranceChecker } from "../../domain/validation/tolerance-checker";

type WorkoutStep = {
  stepIndex: number;
  durationType: string;
  duration: { type: string; seconds?: number; meters?: number };
  targetType: string;
  target: {
    type: string;
    value?: {
      unit: string;
      value?: number;
      min?: number;
      max?: number;
    };
  };
};

type Workout = {
  name?: string;
  sport: string;
  steps?: Array<WorkoutStep>;
};

const compareStep = (
  step1: WorkoutStep,
  step2: WorkoutStep,
  stepIndex: number,
  stepName: string,
  toleranceChecker: ToleranceChecker
): void => {
  // Skip if step2 doesn't have the expected structure
  if (!step2 || typeof step2 !== "object" || !("durationType" in step2)) {
    return;
  }

  // With kaiord extensions, advanced duration types should now be preserved
  expect(
    step2.durationType,
    `${stepName}: step ${stepIndex} durationType should be preserved (including advanced types with kaiord extensions)`
  ).toBe(step1.durationType);

  // Check duration with tolerance
  if (step1.duration.seconds !== undefined) {
    const violation = toleranceChecker.checkTime(
      step1.duration.seconds,
      step2.duration.seconds!
    );
    expect(
      violation,
      `${stepName}: step ${stepIndex} duration should be within tolerance`
    ).toBeNull();
  }

  if (step1.duration.meters !== undefined) {
    const violation = toleranceChecker.checkDistance(
      step1.duration.meters,
      step2.duration.meters!
    );
    expect(
      violation,
      `${stepName}: step ${stepIndex} distance duration should be within tolerance`
    ).toBeNull();
  }

  // Check power targets with tolerance
  if (
    step1.targetType === "power" &&
    step1.target.value?.unit === "percent_ftp" &&
    step1.target.value.value !== undefined
  ) {
    const violation = toleranceChecker.checkPower(
      step1.target.value.value,
      step2.target.value?.value!
    );
    expect(
      violation,
      `${stepName}: step ${stepIndex} power target should be within tolerance`
    ).toBeNull();
  }

  // Check heart rate targets with tolerance
  if (
    step1.targetType === "heart_rate" &&
    step1.target.value?.unit === "range"
  ) {
    if (step1.target.value.min !== undefined) {
      const violation = toleranceChecker.checkHeartRate(
        step1.target.value.min,
        step2.target.value?.min!
      );
      expect(
        violation,
        `${stepName}: step ${stepIndex} HR min should be within tolerance`
      ).toBeNull();
    }
    if (step1.target.value.max !== undefined) {
      const violation = toleranceChecker.checkHeartRate(
        step1.target.value.max,
        step2.target.value?.max!
      );
      expect(
        violation,
        `${stepName}: step ${stepIndex} HR max should be within tolerance`
      ).toBeNull();
    }
  }
};

export const compareWorkoutStructures = (
  original: KRD,
  converted: KRD,
  stepName: string,
  toleranceChecker: ToleranceChecker
): void => {
  const workout1 = original.extensions?.workout as Workout | undefined;
  const workout2 = converted.extensions?.workout as Workout | undefined;

  if (!workout1 || !workout2) {
    return; // Skip if no workout data
  }

  // Compare basic properties
  if (workout1.name) {
    expect(workout2.name, `${stepName}: name should be preserved`).toBe(
      workout1.name
    );
  }
  expect(workout2.sport, `${stepName}: sport should be preserved`).toBe(
    workout1.sport
  );

  // Compare steps if both have them
  if (workout1.steps && workout2.steps) {
    expect(
      workout2.steps.length,
      `${stepName}: step count should be preserved`
    ).toBe(workout1.steps.length);

    // Compare each step with tolerance
    for (let i = 0; i < workout1.steps.length; i++) {
      compareStep(
        workout1.steps[i],
        workout2.steps[i],
        i,
        stepName,
        toleranceChecker
      );
    }
  }
};
