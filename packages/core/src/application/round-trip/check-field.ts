import type { ToleranceViolation } from "../../domain/validation/tolerance-checker";

export const checkField = (
  violations: Array<ToleranceViolation>,
  checkFn: (expected: number, actual: number) => ToleranceViolation | null,
  value1: number | undefined,
  value2: number | undefined,
  fieldName: string
): void => {
  if (value1 !== undefined && value2 !== undefined) {
    const violation = checkFn(value1, value2);
    if (violation) {
      violations.push({ ...violation, field: fieldName });
    }
  }
};
