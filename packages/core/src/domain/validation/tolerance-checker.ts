import { z } from "zod";

export const toleranceConfigSchema = z.object({
  timeTolerance: z.number().positive(),
  distanceTolerance: z.number().positive(),
  powerTolerance: z.number().positive(),
  ftpTolerance: z.number().positive(),
  hrTolerance: z.number().positive(),
  cadenceTolerance: z.number().positive(),
  paceTolerance: z.number().positive(),
});

export type ToleranceConfig = z.infer<typeof toleranceConfigSchema>;

export const DEFAULT_TOLERANCES: ToleranceConfig = {
  timeTolerance: 1,
  distanceTolerance: 1,
  powerTolerance: 1,
  ftpTolerance: 1,
  hrTolerance: 1,
  cadenceTolerance: 1,
  paceTolerance: 0.01,
};

/**
 * A round-trip drift. `tolerance` 0 marks a value that must match exactly
 * (a count, a zone). A categorical mismatch (a duration type, a target unit)
 * carries `expectedValue`/`actualValue`; its numeric fields are then the
 * fixed sentinel `expected 0, actual 1, deviation 1, tolerance 0`.
 */
export const toleranceViolationSchema = z.object({
  field: z.string(),
  expected: z.number(),
  actual: z.number(),
  deviation: z.number().nonnegative(),
  tolerance: z.number().nonnegative(),
  expectedValue: z.string().optional(),
  actualValue: z.string().optional(),
});

export type ToleranceViolation = z.infer<typeof toleranceViolationSchema>;

export type ToleranceChecker = {
  checkTime: (expected: number, actual: number) => ToleranceViolation | null;
  checkDistance: (
    expected: number,
    actual: number
  ) => ToleranceViolation | null;
  checkPower: (expected: number, actual: number) => ToleranceViolation | null;
  checkHeartRate: (
    expected: number,
    actual: number
  ) => ToleranceViolation | null;
  checkCadence: (expected: number, actual: number) => ToleranceViolation | null;
  checkPace: (expected: number, actual: number) => ToleranceViolation | null;
  /** Percentage-of-FTP check; comparers fall back to `checkPower` when absent. */
  checkPercentFtp?: (
    expected: number,
    actual: number
  ) => ToleranceViolation | null;
};

const check = (
  field: string,
  expected: number,
  actual: number,
  tolerance: number
): ToleranceViolation | null => {
  const deviation = Math.abs(expected - actual);
  return deviation > tolerance
    ? { field, expected, actual, deviation, tolerance }
    : null;
};

export const createToleranceChecker = (
  config: ToleranceConfig = DEFAULT_TOLERANCES
): ToleranceChecker => ({
  checkTime: (expected, actual) =>
    check("time", expected, actual, config.timeTolerance),
  checkDistance: (expected, actual) =>
    check("distance", expected, actual, config.distanceTolerance),
  checkPower: (expected, actual) =>
    check("power", expected, actual, config.powerTolerance),
  checkHeartRate: (expected, actual) =>
    check("heartRate", expected, actual, config.hrTolerance),
  checkCadence: (expected, actual) =>
    check("cadence", expected, actual, config.cadenceTolerance),
  checkPace: (expected, actual) =>
    check("pace", expected, actual, config.paceTolerance),
  checkPercentFtp: (expected, actual) =>
    check("percentFtp", expected, actual, config.ftpTolerance),
});
