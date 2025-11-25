import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { FitReader } from "../../ports/fit-reader";
import type { Logger } from "../../ports/logger";

type ConvertFitToKrdParams = {
  fitBuffer: Uint8Array;
};

/**
 * TypeScript type for the convertFitToKrd use case function.
 *
 * Automatically inferred from the {@link convertFitToKrd} factory function.
 */
export type ConvertFitToKrd = ReturnType<typeof convertFitToKrd>;

/**
 * Converts a FIT workout file to KRD format.
 *
 * This use case orchestrates the conversion from Garmin FIT binary format to the
 * canonical KRD JSON format, with schema validation to ensure data integrity.
 *
 * @param fitReader - FIT file reader implementation
 * @param validator - Schema validator for KRD validation
 * @param logger - Logger for operation tracking
 * @returns A function that accepts conversion parameters and returns a Promise of KRD
 *
 * @throws {FitParsingError} When FIT file parsing fails
 * @throws {KrdValidationError} When the resulting KRD doesn't pass schema validation
 *
 * @example
 * ```typescript
 * import { convertFitToKrd, createDefaultProviders } from '@kaiord/core';
 * import { readFileSync } from 'fs';
 *
 * // Create use case with dependencies
 * const providers = createDefaultProviders();
 * const convert = convertFitToKrd(
 *   providers.fitReader,
 *   providers.validator,
 *   providers.logger
 * );
 *
 * // Execute conversion
 * const fitBuffer = readFileSync('workout.fit');
 * const krd = await convert({ fitBuffer });
 *
 * console.log('Converted workout:', krd.workout?.name);
 * ```
 *
 * @example
 * ```typescript
 * // With custom logger
 * import { convertFitToKrd, createGarminFitSdkReader, createSchemaValidator } from '@kaiord/core';
 *
 * const customLogger = {
 *   debug: (msg, ctx) => console.debug(msg, ctx),
 *   info: (msg, ctx) => console.info(msg, ctx),
 *   warn: (msg, ctx) => console.warn(msg, ctx),
 *   error: (msg, ctx) => console.error(msg, ctx)
 * };
 *
 * const convert = convertFitToKrd(
 *   createGarminFitSdkReader(customLogger),
 *   createSchemaValidator(),
 *   customLogger
 * );
 * ```
 */
export const convertFitToKrd =
  (fitReader: FitReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertFitToKrdParams): Promise<KRD> => {
    logger.info("Converting FIT to KRD");

    const krd = await fitReader(params.fitBuffer);

    const errors = validator.validate(krd);
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

    logger.info("FIT to KRD conversion successful");
    return krd;
  };
