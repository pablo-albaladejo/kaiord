import { createKrdValidationError } from "../../domain/types/errors";
import type { KRD } from "../../domain/schemas/krd";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { Logger } from "../../ports/logger";
import type { TcxWriter } from "../../ports/tcx-writer";

type ConvertKrdToTcxParams = {
  krd: KRD;
};

export type ConvertKrdToTcx = ReturnType<typeof convertKrdToTcx>;

export const convertKrdToTcx =
  (tcxWriter: TcxWriter, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertKrdToTcxParams): Promise<string> => {
    logger.info("Converting KRD to TCX");

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

    const tcxString = await tcxWriter(params.krd);

    logger.info("KRD to TCX conversion successful");
    return tcxString;
  };
