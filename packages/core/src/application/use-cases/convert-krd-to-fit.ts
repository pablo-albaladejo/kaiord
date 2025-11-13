import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { FitWriter } from "../../ports/fit-writer";
import type { Logger } from "../../ports/logger";

type ConvertKrdToFitParams = {
  krd: KRD;
};

export type ConvertKrdToFit = ReturnType<typeof convertKrdToFit>;

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

    const fitBuffer = await fitWriter.writeFromKRD(params.krd);

    logger.info("KRD to FIT conversion successful");
    return fitBuffer;
  };
