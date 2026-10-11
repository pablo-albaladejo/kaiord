import type { ToleranceViolation } from "../../domain/validation/tolerance-checker";

export type NumericCheck = (
  expected: number,
  actual: number
) => ToleranceViolation | null;

/** A value that must survive the round-trip unchanged (count, zone, index). */
export const exactCheck: NumericCheck = (expected, actual) =>
  expected === actual
    ? null
    : {
        field: "exact",
        expected,
        actual,
        deviation: Math.abs(expected - actual),
        tolerance: 0,
      };

export const pushNumeric = (
  violations: Array<ToleranceViolation>,
  field: string,
  check: NumericCheck,
  expected: number,
  actual: number
): void => {
  const violation = check(expected, actual);
  if (violation) violations.push({ ...violation, field });
};

/**
 * Pushes a categorical mismatch. The numeric fields are the fixed sentinel
 * documented on `toleranceViolationSchema`; the values are the strings.
 */
export const pushCategorical = (
  violations: Array<ToleranceViolation>,
  field: string,
  expectedValue: string | undefined,
  actualValue: string | undefined
): boolean => {
  if (expectedValue === actualValue) return false;
  violations.push({
    field,
    expected: 0,
    actual: 1,
    deviation: 1,
    tolerance: 0,
    expectedValue: expectedValue ?? "(none)",
    actualValue: actualValue ?? "(none)",
  });
  return true;
};
