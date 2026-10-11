import type { KRD } from "../../domain/schemas/krd";
import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../domain/schemas/workout";
import { isRepetitionBlock } from "../../domain/type-guards";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { compareStepDuration } from "./compare-step-duration";
import { compareStepTarget } from "./compare-step-target";
import { exactCheck, pushCategorical, pushNumeric } from "./step-violations";

type StepNode = WorkoutStep | RepetitionBlock;

const stepsOf = (krd: KRD): Array<StepNode> | undefined => {
  const workout = krd.extensions?.structured_workout as
    { steps?: Array<StepNode> } | undefined;
  return workout?.steps;
};

const kindOf = (node: StepNode): string =>
  isRepetitionBlock(node) ? "repetition" : "step";

const compareNode = (
  violations: Array<ToleranceViolation>,
  path: string,
  n1: StepNode,
  n2: StepNode,
  checker: ToleranceChecker
): void => {
  if (pushCategorical(violations, `${path}.kind`, kindOf(n1), kindOf(n2))) {
    return;
  }
  if (isRepetitionBlock(n1) && isRepetitionBlock(n2)) {
    const field = `${path}.repeatCount`;
    pushNumeric(violations, field, exactCheck, n1.repeatCount, n2.repeatCount);
    compareStepList(violations, `${path}.steps`, n1.steps, n2.steps, checker);
    return;
  }
  const s1 = n1 as WorkoutStep;
  const s2 = n2 as WorkoutStep;
  compareStepDuration(
    violations,
    `${path}.duration`,
    s1.duration,
    s2.duration,
    checker
  );
  compareStepTarget(
    violations,
    `${path}.target`,
    s1.target,
    s2.target,
    checker
  );
  pushCategorical(violations, `${path}.intensity`, s1.intensity, s2.intensity);
};

/**
 * Unlike sessions, laps and records, a dropped or added step is a round-trip
 * failure, so the step count must match exactly.
 */
const compareStepList = (
  violations: Array<ToleranceViolation>,
  path: string,
  list1: Array<StepNode>,
  list2: Array<StepNode>,
  checker: ToleranceChecker
): void => {
  const lengthField = `${path}.length`;
  pushNumeric(violations, lengthField, exactCheck, list1.length, list2.length);
  const shared = Math.min(list1.length, list2.length);
  for (let i = 0; i < shared; i++) {
    compareNode(violations, `${path}[${i}]`, list1[i]!, list2[i]!, checker);
  }
};

export const compareWorkoutSteps = (
  krd1: KRD,
  krd2: KRD,
  checker: ToleranceChecker
): Array<ToleranceViolation> => {
  const violations: Array<ToleranceViolation> = [];
  const steps1 = stepsOf(krd1);
  const steps2 = stepsOf(krd2);
  const path = "structured_workout.steps";
  if (steps1 === undefined && steps2 === undefined) return violations;
  if (steps1 === undefined || steps2 === undefined) {
    const present = (s: unknown) => (s === undefined ? "absent" : "present");
    pushCategorical(violations, path, present(steps1), present(steps2));
    return violations;
  }
  compareStepList(violations, path, steps1, steps2, checker);
  return violations;
};
