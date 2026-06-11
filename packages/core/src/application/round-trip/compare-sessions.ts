import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { compareEntityFields } from "./compare-entity-fields";

const SESSION_CHECKS = [
  ["totalElapsedTime", "checkTime"],
  ["totalDistance", "checkDistance"],
  ["avgHeartRate", "checkHeartRate"],
  ["maxHeartRate", "checkHeartRate"],
  ["avgCadence", "checkCadence"],
  ["avgPower", "checkPower"],
] as const;

export const compareSessions = (
  krd1: KRD,
  krd2: KRD,
  checker: ToleranceChecker
): Array<ToleranceViolation> => {
  const violations: Array<ToleranceViolation> = [];
  const sessions1 = krd1.sessions ?? [];
  const sessions2 = krd2.sessions ?? [];
  for (let i = 0; i < Math.min(sessions1.length, sessions2.length); i++) {
    const s1 = sessions1[i];
    const s2 = sessions2[i];
    if (!s1 || !s2) continue;
    compareEntityFields(
      violations,
      s1,
      s2,
      checker,
      `sessions[${i}]`,
      SESSION_CHECKS
    );
  }
  return violations;
};
