/**
 * Test Fixture Helpers
 *
 * Utilities for loading shared test fixtures across packages.
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { KRD } from "../domain/schemas/krd";

/**
 * Base path to fixtures directory
 * In development: points to src/tests/fixtures
 * In production: points to published src/tests/fixtures
 */
const FIXTURES_DIR = __dirname.includes("/dist/")
  ? join(__dirname, "../../src/tests/fixtures")
  : join(__dirname, "../tests/fixtures");

/**
 * Load a FIT file fixture as a buffer
 *
 * @param filename - Name of the FIT file (e.g., "WorkoutIndividualSteps.fit")
 * @returns Buffer containing the FIT file data
 *
 * @example
 * ```typescript
 * const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
 * const krd = await fitReader.readToKRD(fitBuffer);
 * ```
 */
export const loadFitFixture = (filename: string): Uint8Array => {
  const path = join(FIXTURES_DIR, "fit-files", filename);
  return readFileSync(path);
};

/**
 * Load a KRD file fixture as a parsed object
 *
 * @param filename - Name of the KRD file (e.g., "WorkoutIndividualSteps.krd")
 * @returns Parsed KRD object
 *
 * @example
 * ```typescript
 * const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
 * expect(krd.version).toBe("1.0");
 * ```
 */
export const loadKrdFixture = (filename: string): KRD => {
  const path = join(FIXTURES_DIR, "krd-files", filename);
  const json = readFileSync(path, "utf-8");
  return JSON.parse(json) as KRD;
};

/**
 * Load a KRD file fixture as raw JSON string
 *
 * @param filename - Name of the KRD file (e.g., "WorkoutIndividualSteps.krd")
 * @returns Raw JSON string
 *
 * @example
 * ```typescript
 * const jsonString = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
 * const krd = JSON.parse(jsonString);
 * ```
 */
export const loadKrdFixtureRaw = (filename: string): string => {
  const path = join(FIXTURES_DIR, "krd-files", filename);
  return readFileSync(path, "utf-8");
};

/**
 * Get the full path to a fixture file
 *
 * @param type - Type of fixture ("fit" or "krd")
 * @param filename - Name of the file
 * @returns Full path to the fixture file
 *
 * @example
 * ```typescript
 * const path = getFixturePath("fit", "WorkoutIndividualSteps.fit");
 * const buffer = readFileSync(path);
 * ```
 */
export const getFixturePath = (
  type: "fit" | "krd",
  filename: string
): string => {
  const subdir = type === "fit" ? "fit-files" : "krd-files";
  return join(FIXTURES_DIR, subdir, filename);
};

/**
 * Available fixture names (without extension)
 */
export const FIXTURE_NAMES = {
  INDIVIDUAL_STEPS: "WorkoutIndividualSteps",
  REPEAT_STEPS: "WorkoutRepeatSteps",
  CUSTOM_TARGET_VALUES: "WorkoutCustomTargetValues",
  REPEAT_GREATER_THAN: "WorkoutRepeatGreaterThanStep",
} as const;

/**
 * Load a fixture pair (FIT + KRD) for round-trip testing
 *
 * @param baseName - Base name without extension (e.g., "WorkoutIndividualSteps")
 * @returns Object with both FIT buffer and KRD object
 *
 * @example
 * ```typescript
 * const { fit, krd } = loadFixturePair("WorkoutIndividualSteps");
 * const converted = await fitReader.readToKRD(fit);
 * expect(converted).toEqual(krd);
 * ```
 */
export const loadFixturePair = (
  baseName: string
): { fit: Uint8Array; krd: KRD } => {
  return {
    fit: loadFitFixture(`${baseName}.fit`),
    krd: loadKrdFixture(`${baseName}.krd`),
  };
};
