/**
 * Fixture Path Helpers for CLI Tests
 *
 * Provides centralized access to test fixtures from monorepo root.
 * All fixtures are maintained in /test-fixtures/ directory.
 */

import { resolve } from "path";

/**
 * Get absolute path to a fixture file
 *
 * @param type - Fixture type (fit, krd, tcx, zwo)
 * @param filename - Fixture filename
 * @returns Absolute path to fixture file
 *
 * @example
 * ```typescript
 * const fitPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
 * const krdPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");
 * ```
 */
export const getFixturePath = (
  type: "fit" | "krd" | "tcx" | "zwo",
  filename: string
): string => {
  // Navigate from CLI package to monorepo root test-fixtures
  // packages/cli/src/tests/helpers -> test-fixtures
  return resolve(__dirname, `../../../../../test-fixtures/${type}/${filename}`);
};

/**
 * Get absolute path to fixtures directory
 *
 * @param type - Fixture type (fit, krd, tcx, zwo)
 * @returns Absolute path to fixtures directory
 *
 * @example
 * ```typescript
 * const fitDir = getFixturesDir("fit");
 * // Use with glob: `${fitDir}/*.fit`
 * ```
 */
export const getFixturesDir = (type: "fit" | "krd" | "tcx" | "zwo"): string => {
  return resolve(__dirname, `../../../../../test-fixtures/${type}`);
};

/**
 * Predefined fixture names for common test files
 */
export const FIXTURE_NAMES = {
  INDIVIDUAL_STEPS: "WorkoutIndividualSteps",
  REPEAT_STEPS: "WorkoutRepeatSteps",
  CUSTOM_TARGET_VALUES: "WorkoutCustomTargetValues",
  REPEAT_GREATER_THAN: "WorkoutRepeatGreaterThanStep",
} as const;
