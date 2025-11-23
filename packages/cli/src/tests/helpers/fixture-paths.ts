/**
 * Fixture Path Helpers for CLI Tests
 *
 * Provides centralized access to test fixtures from @kaiord/core.
 * All fixtures are maintained in core package to avoid duplication.
 */

import { resolve } from "path";

/**
 * Get absolute path to a fixture file in @kaiord/core
 *
 * @param type - Fixture type (fit-files, krd-files, tcx-files, zwift-files)
 * @param filename - Fixture filename
 * @returns Absolute path to fixture file
 *
 * @example
 * ```typescript
 * const fitPath = getFixturePath("fit-files", "WorkoutIndividualSteps.fit");
 * const krdPath = getFixturePath("krd-files", "WorkoutIndividualSteps.krd");
 * ```
 */
export const getFixturePath = (
  type: "fit-files" | "krd-files" | "tcx-files" | "zwift-files",
  filename: string
): string => {
  // Navigate from CLI package to core package fixtures
  // packages/cli/src/tests/helpers -> packages/core/src/tests/fixtures
  return resolve(
    __dirname,
    `../../../../core/src/tests/fixtures/${type}/${filename}`
  );
};

/**
 * Get absolute path to fixtures directory
 *
 * @param type - Fixture type (fit-files, krd-files, tcx-files, zwift-files)
 * @returns Absolute path to fixtures directory
 *
 * @example
 * ```typescript
 * const fitDir = getFixturesDir("fit-files");
 * // Use with glob: `${fitDir}/*.fit`
 * ```
 */
export const getFixturesDir = (
  type: "fit-files" | "krd-files" | "tcx-files" | "zwift-files"
): string => {
  return resolve(__dirname, `../../../../core/src/tests/fixtures/${type}`);
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
