import type { KRD } from "../../domain/schemas/krd";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import type { BinaryReader, BinaryWriter } from "../../ports/format-strategy";
import type { Logger } from "../../ports/logger";
import { compareKRDs } from "./compare-krds";

type ValidateFitToKrdToFitParams = {
  originalFit: Uint8Array;
};

type ValidateKrdToFitToKrdParams = {
  originalKrd: KRD;
};

/**
 * TypeScript type for the validateRoundTrip use case function.
 *
 * Automatically inferred from the {@link validateRoundTrip} factory function.
 */
export type ValidateRoundTrip = ReturnType<typeof validateRoundTrip>;

/**
 * Validates round-trip conversion between FIT and KRD formats.
 *
 * This use case provides two validation methods to ensure data integrity during
 * bidirectional conversions, checking that values remain within acceptable tolerances.
 *
 * Default tolerances:
 * - Time: ±1 second
 * - Power: ±1 watt or ±1% FTP
 * - Heart rate: ±1 BPM
 * - Cadence: ±1 RPM
 *
 * @param binaryReader - FIT file reader implementation
 * @param binaryWriter - FIT file writer implementation
 * @param toleranceChecker - Tolerance checker with configured thresholds
 * @param logger - Logger for operation tracking
 * @returns An object with validation methods for both round-trip directions
 *
 * @example
 * ```typescript
 * import { validateRoundTrip, createDefaultProviders, DEFAULT_TOLERANCES } from '@kaiord/core';
 * import { readFileSync } from 'fs';
 *
 * const providers = createDefaultProviders();
 * const validator = validateRoundTrip(
 *   providers.binaryReader,
 *   providers.binaryWriter,
 *   providers.toleranceChecker,
 *   providers.logger
 * );
 *
 * // Validate FIT → KRD → FIT
 * const fitBuffer = readFileSync('workout.fit');
 * const violations = await validator.validateFitToKrdToFit({
 *   originalFit: fitBuffer
 * });
 *
 * if (violations.length > 0) {
 *   console.error('Round-trip validation failed:');
 *   violations.forEach(v => {
 *     console.error(`  ${v.field}: expected ${v.expected}, got ${v.actual}`);
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Validate KRD → FIT → KRD
 * const krd = {
 *   version: '1.0',
 *   type: 'structured_workout',
 *   metadata: { created: '2025-01-15T10:30:00Z', sport: 'running' }
 * };
 *
 * const violations = await validator.validateKrdToFitToKrd({
 *   originalKrd: krd
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom tolerance configuration
 * import { createToleranceChecker, toleranceConfigSchema } from '@kaiord/core';
 *
 * const customConfig = toleranceConfigSchema.parse({
 *   time: 2,      // ±2 seconds
 *   power: 5,     // ±5 watts
 *   heartRate: 2, // ±2 BPM
 *   cadence: 2    // ±2 RPM
 * });
 *
 * const customChecker = createToleranceChecker(customConfig);
 * const validator = validateRoundTrip(
 *   providers.binaryReader,
 *   providers.binaryWriter,
 *   customChecker,
 *   providers.logger
 * );
 * ```
 */
export const validateRoundTrip = (
  binaryReader: BinaryReader,
  binaryWriter: BinaryWriter,
  toleranceChecker: ToleranceChecker,
  logger: Logger
) => ({
  validateFitToKrdToFit: async (
    params: ValidateFitToKrdToFitParams
  ): Promise<Array<ToleranceViolation>> => {
    logger.info("Validating FIT → KRD → FIT round-trip");

    const krd = await binaryReader(params.originalFit);
    const convertedFit = await binaryWriter(krd);
    const krd2 = await binaryReader(convertedFit);

    const violations = compareKRDs(krd, krd2, toleranceChecker, logger);

    if (violations.length === 0) {
      logger.info("FIT → KRD → FIT round-trip validation passed");
    } else {
      logger.warn("FIT → KRD → FIT round-trip validation failed", {
        violationCount: violations.length,
      });
    }

    return violations;
  },

  validateKrdToFitToKrd: async (
    params: ValidateKrdToFitToKrdParams
  ): Promise<Array<ToleranceViolation>> => {
    logger.info("Validating KRD → FIT → KRD round-trip");

    const fit = await binaryWriter(params.originalKrd);
    const convertedKrd = await binaryReader(fit);
    const fit2 = await binaryWriter(convertedKrd);
    const krd2 = await binaryReader(fit2);

    const violations = compareKRDs(
      params.originalKrd,
      krd2,
      toleranceChecker,
      logger
    );

    if (violations.length === 0) {
      logger.info("KRD → FIT → KRD round-trip validation passed");
    } else {
      logger.warn("KRD → FIT → KRD round-trip validation failed", {
        violationCount: violations.length,
      });
    }

    return violations;
  },
});
