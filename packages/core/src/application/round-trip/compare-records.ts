import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { checkField } from "./check-field";

export const compareRecords = (
  krd1: KRD,
  krd2: KRD,
  checker: ToleranceChecker
): Array<ToleranceViolation> => {
  const violations: Array<ToleranceViolation> = [];

  if (!krd1.records || !krd2.records) {
    return violations;
  }

  for (let i = 0; i < Math.min(krd1.records.length, krd2.records.length); i++) {
    const r1 = krd1.records[i];
    const r2 = krd2.records[i];

    checkField(
      violations,
      checker.checkHeartRate,
      r1.heartRate,
      r2.heartRate,
      `records[${i}].heartRate`
    );
    checkField(
      violations,
      checker.checkCadence,
      r1.cadence,
      r2.cadence,
      `records[${i}].cadence`
    );
    checkField(
      violations,
      checker.checkPower,
      r1.power,
      r2.power,
      `records[${i}].power`
    );
    checkField(
      violations,
      checker.checkPace,
      r1.speed,
      r2.speed,
      `records[${i}].speed`
    );
    checkField(
      violations,
      checker.checkDistance,
      r1.distance,
      r2.distance,
      `records[${i}].distance`
    );
  }

  return violations;
};
