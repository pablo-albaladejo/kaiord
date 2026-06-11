import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { compareEntityFields } from "./compare-entity-fields";

const RECORD_CHECKS = [
  ["heartRate", "checkHeartRate"],
  ["cadence", "checkCadence"],
  ["power", "checkPower"],
  ["speed", "checkPace"],
  ["distance", "checkDistance"],
] as const;

export const compareRecords = (
  krd1: KRD,
  krd2: KRD,
  checker: ToleranceChecker
): Array<ToleranceViolation> => {
  const violations: Array<ToleranceViolation> = [];
  const records1 = krd1.records ?? [];
  const records2 = krd2.records ?? [];
  for (let i = 0; i < Math.min(records1.length, records2.length); i++) {
    const r1 = records1[i];
    const r2 = records2[i];
    if (!r1 || !r2) continue;
    compareEntityFields(
      violations,
      r1,
      r2,
      checker,
      `records[${i}]`,
      RECORD_CHECKS
    );
  }
  return violations;
};
