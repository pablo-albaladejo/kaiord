import type { KRD } from "@kaiord/core";
import { isDifferent } from "./comparators";

type StepDiff = {
  stepIndex: number;
  field: string;
  file1Value: unknown;
  file2Value: unknown;
};

/**
 * Compare workout steps between two KRD files
 */
export const compareSteps = (
  krd1: KRD,
  krd2: KRD
): {
  file1Count: number;
  file2Count: number;
  differences: Array<StepDiff>;
} => {
  const workout1 = krd1.extensions?.structured_workout as
    | { steps?: Array<unknown> }
    | undefined;
  const workout2 = krd2.extensions?.structured_workout as
    | { steps?: Array<unknown> }
    | undefined;

  const steps1 = workout1?.steps || [];
  const steps2 = workout2?.steps || [];
  const differences: Array<StepDiff> = [];
  const maxSteps = Math.max(steps1.length, steps2.length);

  for (let i = 0; i < maxSteps; i++) {
    const step1 = steps1[i] as Record<string, unknown> | undefined;
    const step2 = steps2[i] as Record<string, unknown> | undefined;

    if (!step1 && step2) {
      differences.push({
        stepIndex: i,
        field: "step",
        file1Value: undefined,
        file2Value: step2,
      });
      continue;
    }

    if (step1 && !step2) {
      differences.push({
        stepIndex: i,
        field: "step",
        file1Value: step1,
        file2Value: undefined,
      });
      continue;
    }

    if (!step1 || !step2) continue;

    compareStepFields(i, step1, step2, differences);
  }

  return { file1Count: steps1.length, file2Count: steps2.length, differences };
};

const STEP_FIELDS = [
  "stepIndex",
  "name",
  "durationType",
  "duration",
  "targetType",
  "target",
  "intensity",
  "notes",
  "equipment",
];

function compareStepFields(
  stepIndex: number,
  step1: Record<string, unknown>,
  step2: Record<string, unknown>,
  differences: Array<StepDiff>
): void {
  for (const field of STEP_FIELDS) {
    if (isDifferent(step1[field], step2[field])) {
      differences.push({
        stepIndex,
        field,
        file1Value: step1[field],
        file2Value: step2[field],
      });
    }
  }
}
