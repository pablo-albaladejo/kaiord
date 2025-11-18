import type { KRD } from "../../domain/schemas/krd";
import { createKrdValidationError } from "../../domain/types/errors";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { Logger } from "../../ports/logger";
import type { ZwiftReader } from "../../ports/zwift-reader";

type ConvertZwiftToKrdParams = {
  zwiftString: string;
};

export type ConvertZwiftToKrd = ReturnType<typeof convertZwiftToKrd>;

export const convertZwiftToKrd =
  (zwiftReader: ZwiftReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertZwiftToKrdParams): Promise<KRD> => {
    logger.info("Converting Zwift to KRD");

    const krd = await zwiftReader(params.zwiftString);

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

    logger.info("Zwift to KRD conversion successful");
    return krd;
  };
