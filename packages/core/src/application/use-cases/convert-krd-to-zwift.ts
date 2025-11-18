import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { Logger } from "../../ports/logger";
import type { ZwiftWriter } from "../../ports/zwift-writer";

type ConvertKrdToZwiftParams = {
  krd: KRD;
};

export type ConvertKrdToZwift = ReturnType<typeof convertKrdToZwift>;

export const convertKrdToZwift =
  (zwiftWriter: ZwiftWriter, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertKrdToZwiftParams): Promise<string> => {
    logger.info("Converting KRD to Zwift");

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

    const zwiftString = await zwiftWriter(params.krd);

    logger.info("KRD to Zwift conversion successful");
    return zwiftString;
  };
