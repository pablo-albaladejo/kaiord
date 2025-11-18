/**
 * Supporting types for error context
 */
export type ValidationError = {
  field: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
};

export type ToleranceViolation = {
  field: string;
  expected: number;
  actual: number;
  deviation: number;
  tolerance: number;
};
