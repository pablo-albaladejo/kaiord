import { createKrdValidationError } from "../../domain/types/errors";
import type { KRD } from "../../domain/schemas/krd";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { GarminReader } from "../../ports/garmin-reader";
import type { Logger } from "../../ports/logger";

type ConvertGarminToKrdParams = {
  gcnString: string;
};

/**
 * TypeScript type for the convertGarminToKrd use case function.
 */
export type ConvertGarminToKrd = ReturnType<typeof convertGarminToKrd>;

/**
 * Converts a Garmin Connect JSON (GCN) string to KRD format.
 */
export const convertGarminToKrd =
  (garminReader: GarminReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertGarminToKrdParams): Promise<KRD> => {
    logger.info("Converting Garmin GCN to KRD");

    const krd = await garminReader(params.gcnString);

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

    logger.info("Garmin GCN to KRD conversion successful");
    return krd;
  };
