import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { compareEntityFields } from "./compare-entity-fields";

const LAP_CHECKS = [
  ["totalElapsedTime", "checkTime"],
  ["totalDistance", "checkDistance"],
  ["avgHeartRate", "checkHeartRate"],
  ["maxHeartRate", "checkHeartRate"],
  ["avgCadence", "checkCadence"],
  ["avgPower", "checkPower"],
] as const;

export const compareLaps = (
  krd1: KRD,
  krd2: KRD,
  checker: ToleranceChecker
): Array<ToleranceViolation> => {
  const violations: Array<ToleranceViolation> = [];
  const laps1 = krd1.laps ?? [];
  const laps2 = krd2.laps ?? [];
  for (let i = 0; i < Math.min(laps1.length, laps2.length); i++) {
    const l1 = laps1[i];
    const l2 = laps2[i];
    if (!l1 || !l2) continue;
    compareEntityFields(violations, l1, l2, checker, `laps[${i}]`, LAP_CHECKS);
  }
  return violations;
};
