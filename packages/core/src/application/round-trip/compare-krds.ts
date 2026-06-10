import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import type { Logger } from "../../ports/logger";
import { compareLaps } from "./compare-laps";
import { compareRecords } from "./compare-records";
import { compareSessions } from "./compare-sessions";

export const compareKRDs = (
  krd1: KRD,
  krd2: KRD,
  toleranceChecker: ToleranceChecker,
  logger: Logger
): Array<ToleranceViolation> => {
  logger.debug("Comparing KRD documents");
  const violations: Array<ToleranceViolation> = [];

  violations.push(...compareSessions(krd1, krd2, toleranceChecker));
  violations.push(...compareLaps(krd1, krd2, toleranceChecker));
  violations.push(...compareRecords(krd1, krd2, toleranceChecker));

  return violations;
};
