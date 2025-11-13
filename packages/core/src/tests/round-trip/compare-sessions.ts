import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { checkField } from "./check-field";

export const compareSessions = (
  krd1: KRD,
  krd2: KRD,
  checker: ToleranceChecker
): Array<ToleranceViolation> => {
  const violations: Array<ToleranceViolation> = [];

  if (!krd1.sessions || !krd2.sessions) {
    return violations;
  }

  for (
    let i = 0;
    i < Math.min(krd1.sessions.length, krd2.sessions.length);
    i++
  ) {
    const s1 = krd1.sessions[i];
    const s2 = krd2.sessions[i];

    checkField(
      violations,
      checker.checkTime,
      s1.totalElapsedTime,
      s2.totalElapsedTime,
      `sessions[${i}].totalElapsedTime`
    );
    checkField(
      violations,
      checker.checkDistance,
      s1.totalDistance,
      s2.totalDistance,
      `sessions[${i}].totalDistance`
    );
    checkField(
      violations,
      checker.checkHeartRate,
      s1.avgHeartRate,
      s2.avgHeartRate,
      `sessions[${i}].avgHeartRate`
    );
    checkField(
      violations,
      checker.checkHeartRate,
      s1.maxHeartRate,
      s2.maxHeartRate,
      `sessions[${i}].maxHeartRate`
    );
    checkField(
      violations,
      checker.checkCadence,
      s1.avgCadence,
      s2.avgCadence,
      `sessions[${i}].avgCadence`
    );
    checkField(
      violations,
      checker.checkPower,
      s1.avgPower,
      s2.avgPower,
      `sessions[${i}].avgPower`
    );
  }

  return violations;
};
