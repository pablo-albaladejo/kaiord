import { expect } from "vitest";
import type { ToleranceChecker } from "../../../domain/validation/tolerance-checker";

type NestedStep = {
  stepIndex: number;
  durationType: string;
  targetType: string;
  duration: { type: string; seconds?: number };
  target: {
    type: string;
    value: { unit: string; value?: number };
  };
};

type RepetitionBlock = {
  repeatCount: number;
  steps: Array<NestedStep>;
};

const compareNestedSteps = (
  nestedStep1: NestedStep,
  nestedStep2: NestedStep,
  toleranceChecker: ToleranceChecker
): void => {
  expect(nestedStep2.durationType).toBe(nestedStep1.durationType);
  expect(nestedStep2.targetType).toBe(nestedStep1.targetType);

  // Check duration with tolerance
  if (nestedStep1.duration.seconds !== undefined) {
    const violation = toleranceChecker.checkTime(
      nestedStep1.duration.seconds,
      nestedStep2.duration.seconds!
    );
    expect(violation).toBeNull();
  }

  // Check power with tolerance
  if (
    nestedStep1.targetType === "power" &&
    nestedStep1.target.value.unit === "percent_ftp"
  ) {
    const violation = toleranceChecker.checkPower(
      nestedStep1.target.value.value!,
      nestedStep2.target.value.value!
    );
    expect(violation).toBeNull();
  }
};

export const compareRepetitionBlocks = (
  step1: RepetitionBlock | { stepIndex: number },
  step2: RepetitionBlock | { stepIndex: number },
  toleranceChecker: ToleranceChecker
): void => {
  if ("repeatCount" in step1 && "repeatCount" in step2) {
    expect(step2.repeatCount).toBe(step1.repeatCount);
    expect(step2.steps.length).toBe(step1.steps.length);

    // Check nested steps with tolerance
    for (let j = 0; j < step1.steps.length; j++) {
      compareNestedSteps(step1.steps[j], step2.steps[j], toleranceChecker);
    }
  }
};
