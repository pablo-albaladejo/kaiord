import type { Duration } from "../../domain/schemas/duration";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import {
  exactCheck,
  type NumericCheck,
  pushCategorical,
  pushNumeric,
} from "./step-violations";

type DurationValues = Partial<
  Record<
    "seconds" | "meters" | "bpm" | "watts" | "calories" | "repeatFrom",
    number
  >
>;

const durationChecks = (
  checker: ToleranceChecker
): ReadonlyArray<readonly [keyof DurationValues, NumericCheck]> => [
  ["seconds", checker.checkTime],
  ["meters", checker.checkDistance],
  ["bpm", checker.checkHeartRate],
  ["watts", checker.checkPower],
  ["calories", exactCheck],
  ["repeatFrom", exactCheck],
];

/** Compares a step duration: its type, then each value it carries. */
export const compareStepDuration = (
  violations: Array<ToleranceViolation>,
  path: string,
  d1: Duration,
  d2: Duration,
  checker: ToleranceChecker
): void => {
  if (pushCategorical(violations, `${path}.type`, d1.type, d2.type)) return;
  const v1 = d1 as DurationValues;
  const v2 = d2 as DurationValues;
  for (const [key, check] of durationChecks(checker)) {
    const a = v1[key];
    const b = v2[key];
    if (a === undefined || b === undefined) continue;
    pushNumeric(violations, `${path}.${key}`, check, a, b);
  }
};
