import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { checkField } from "./check-field";

type NumericCheck = (
  expected: number,
  actual: number
) => ToleranceViolation | null;

type CheckerMethod = {
  [K in keyof ToleranceChecker]: ToleranceChecker[K] extends NumericCheck
    ? K
    : never;
}[keyof ToleranceChecker];

/**
 * Runs a table of per-field tolerance checks over two entities of the
 * same shape (sessions, laps, records). Fields that are undefined on
 * either side are skipped by `checkField` — round-trip comparison only
 * flags values that drifted, never values that were absent.
 */
export const compareEntityFields = <K extends string>(
  violations: Array<ToleranceViolation>,
  entity1: Partial<Record<K, number>>,
  entity2: Partial<Record<K, number>>,
  checker: ToleranceChecker,
  label: string,
  checks: ReadonlyArray<readonly [K, CheckerMethod]>
): void => {
  for (const [field, method] of checks) {
    checkField(
      violations,
      checker[method],
      entity1[field],
      entity2[field],
      `${label}.${field}`
    );
  }
};
