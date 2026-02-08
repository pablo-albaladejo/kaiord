import { createKrdValidationError } from "../../domain/types/errors";
import type { KRD } from "../../domain/schemas/krd";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { GarminWriter } from "../../ports/garmin-writer";
import type { Logger } from "../../ports/logger";

type ConvertKrdToGarminParams = {
  krd: KRD;
};

/**
 * TypeScript type for the convertKrdToGarmin use case function.
 */
export type ConvertKrdToGarmin = ReturnType<typeof convertKrdToGarmin>;

/**
 * Converts KRD format to a Garmin Connect JSON (GCN) string.
 */
export const convertKrdToGarmin =
  (garminWriter: GarminWriter, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertKrdToGarminParams): Promise<string> => {
    logger.info("Converting KRD to Garmin GCN");

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

    const gcnString = await garminWriter(params.krd);

    logger.info("KRD to Garmin GCN conversion successful");
    return gcnString;
  };
