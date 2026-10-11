import type { Target } from "../../domain/schemas/target";
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

type TargetValue = { unit: string; value?: number; min?: number; max?: number };

/** The check for a target value, by target type and unit. Zones are exact. */
const checkFor = (
  type: string,
  unit: string,
  checker: ToleranceChecker
): NumericCheck => {
  if (unit === "zone" || unit === "swim_stroke") return exactCheck;
  if (unit === "percent_ftp") {
    return checker.checkPercentFtp ?? checker.checkPower;
  }
  if (type === "power") return checker.checkPower;
  if (type === "heart_rate") return checker.checkHeartRate;
  if (type === "cadence") return checker.checkCadence;
  if (type === "pace") return checker.checkPace;
  return exactCheck;
};

/** Compares a step target: its type, its unit, then its value or range. */
export const compareStepTarget = (
  violations: Array<ToleranceViolation>,
  path: string,
  t1: Target,
  t2: Target,
  checker: ToleranceChecker
): void => {
  if (pushCategorical(violations, `${path}.type`, t1.type, t2.type)) return;
  if (!("value" in t1) || !("value" in t2)) return;
  const v1 = t1.value as TargetValue;
  const v2 = t2.value as TargetValue;
  const unitPath = `${path}.value.unit`;
  if (pushCategorical(violations, unitPath, v1.unit, v2.unit)) return;
  const check = checkFor(t1.type, v1.unit, checker);
  for (const key of ["value", "min", "max"] as const) {
    const a = v1[key];
    const b = v2[key];
    if (a === undefined || b === undefined) continue;
    pushNumeric(violations, `${path}.value.${key}`, check, a, b);
  }
};
