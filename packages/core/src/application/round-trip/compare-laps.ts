import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { checkField } from "./check-field";

export const compareLaps = (
  krd1: KRD,
  krd2: KRD,
  checker: ToleranceChecker
): Array<ToleranceViolation> => {
  const violations: Array<ToleranceViolation> = [];

  if (!krd1.laps || !krd2.laps) {
    return violations;
  }

  for (let i = 0; i < Math.min(krd1.laps.length, krd2.laps.length); i++) {
    const l1 = krd1.laps[i];
    const l2 = krd2.laps[i];

    checkField(
      violations,
      checker.checkTime,
      l1.totalElapsedTime,
      l2.totalElapsedTime,
      `laps[${i}].totalElapsedTime`
    );
    checkField(
      violations,
      checker.checkDistance,
      l1.totalDistance,
      l2.totalDistance,
      `laps[${i}].totalDistance`
    );
    checkField(
      violations,
      checker.checkHeartRate,
      l1.avgHeartRate,
      l2.avgHeartRate,
      `laps[${i}].avgHeartRate`
    );
    checkField(
      violations,
      checker.checkHeartRate,
      l1.maxHeartRate,
      l2.maxHeartRate,
      `laps[${i}].maxHeartRate`
    );
    checkField(
      violations,
      checker.checkCadence,
      l1.avgCadence,
      l2.avgCadence,
      `laps[${i}].avgCadence`
    );
    checkField(
      violations,
      checker.checkPower,
      l1.avgPower,
      l2.avgPower,
      `laps[${i}].avgPower`
    );
  }

  return violations;
};
