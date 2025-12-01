import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { FitWriter } from "../../ports/fit-writer";
import type { Logger } from "../../ports/logger";

type ConvertKrdToFitParams = {
  krd: KRD;
};

/**
 * TypeScript type for the convertKrdToFit use case function.
 *
 * Automatically inferred from the {@link convertKrdToFit} factory function.
 */
export type ConvertKrdToFit = ReturnType<typeof convertKrdToFit>;

/**
 * Converts KRD format to a FIT workout file.
 *
 * This use case orchestrates the conversion from the canonical KRD JSON format
 * to Garmin FIT binary format, with schema validation to ensure data integrity.
 *
 * @param fitWriter - FIT file writer implementation
 * @param validator - Schema validator for KRD validation
 * @param logger - Logger for operation tracking
 * @returns A function that accepts conversion parameters and returns a Promise of FIT buffer
 *
 * @throws {KrdValidationError} When the input KRD doesn't pass schema validation
 * @throws {FitParsingError} When FIT file generation fails
 *
 * @example
 * ```typescript
 * import { convertKrdToFit, createDefaultProviders } from '@kaiord/core';
 * import { writeFileSync } from 'fs';
 *
 * // Create use case with dependencies
 * const providers = createDefaultProviders();
 * const convert = convertKrdToFit(
 *   providers.fitWriter,
 *   providers.validator,
 *   providers.logger
 * );
 *
 * // Execute conversion
 * const krd = {
 *   version: '1.0',
 *   type: 'workout',
 *   metadata: {
 *     created: '2025-01-15T10:30:00Z',
 *     sport: 'running'
 *   }
 * };
 *
 * const fitBuffer = await convert({ krd });
 * writeFileSync('workout.fit', fitBuffer);
 * ```
 */
export const convertKrdToFit =
  (fitWriter: FitWriter, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertKrdToFitParams): Promise<Uint8Array> => {
    logger.info("Converting KRD to FIT");

    const errors = validator.validate(params.krd);
    if (errors.length > 0) {
      logger.error("KRD validation failed", {
        errorCount: errors.length,
        errors,
      });
      throw createKrdValidationError(
        `KRD validation failed: ${errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ")}`,
        errors
      );
    }

    const fitBuffer = await fitWriter(params.krd);

    logger.info("KRD to FIT conversion successful");
    return fitBuffer;
  };
