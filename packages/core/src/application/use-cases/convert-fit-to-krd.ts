import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { FitReader } from "../../ports/fit-reader";
import type { Logger } from "../../ports/logger";

type ConvertFitToKrdParams = {
  fitBuffer: Uint8Array;
};

export type ConvertFitToKrd = ReturnType<typeof convertFitToKrd>;

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
