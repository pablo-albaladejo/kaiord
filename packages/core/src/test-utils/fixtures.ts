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
 * Points to shared test-fixtures at monorepo root
 * From packages/core/src/test-utils/ or packages/core/dist/test-utils/
 * Goes up 4 levels to reach monorepo root, then into test-fixtures/
 */
const FIXTURES_DIR = join(__dirname, "../../../../test-fixtures");

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
  const path = join(FIXTURES_DIR, "fit", filename);
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
  const path = join(FIXTURES_DIR, "krd", filename);
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
  const path = join(FIXTURES_DIR, "krd", filename);
  return readFileSync(path, "utf-8");
};

/**
 * Load a TCX file fixture as a string
 *
 * @param filename - Name of the TCX file (e.g., "WorkoutHeartRateTargets.tcx")
 * @returns TCX XML string
 *
 * @example
 * ```typescript
 * const tcxString = loadTcxFixture("WorkoutHeartRateTargets.tcx");
 * const krd = await tcxReader.readToKRD(tcxString);
 * ```
 */
export const loadTcxFixture = (filename: string): string => {
  const path = join(FIXTURES_DIR, "tcx", filename);
  return readFileSync(path, "utf-8");
};

/**
 * Load a ZWO file fixture as a string
 *
 * @param filename - Name of the ZWO file (e.g., "WorkoutIndividualSteps.zwo")
 * @returns ZWO XML string
 *
 * @example
 * ```typescript
 * const zwoString = loadZwoFixture("WorkoutIndividualSteps.zwo");
 * const krd = await zwoReader.readToKRD(zwoString);
 * ```
 */
export const loadZwoFixture = (filename: string): string => {
  const path = join(FIXTURES_DIR, "zwo", filename);
  return readFileSync(path, "utf-8");
};

/**
 * Get the full path to a fixture file
 *
 * @param type - Type of fixture ("fit", "krd", "tcx", or "zwo")
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
  type: "fit" | "krd" | "tcx" | "zwo",
  filename: string
): string => {
  return join(FIXTURES_DIR, type, filename);
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
