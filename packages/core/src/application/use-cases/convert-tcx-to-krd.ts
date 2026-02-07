import { createKrdValidationError } from "../../domain/types/errors";
import type { KRD } from "../../domain/schemas/krd";
import type { SchemaValidator } from "../../domain/validation/schema-validator";
import type { Logger } from "../../ports/logger";
import type { TcxReader } from "../../ports/tcx-reader";

type ConvertTcxToKrdParams = {
  tcxString: string;
};

export type ConvertTcxToKrd = ReturnType<typeof convertTcxToKrd>;

export const convertTcxToKrd =
  (tcxReader: TcxReader, validator: SchemaValidator, logger: Logger) =>
  async (params: ConvertTcxToKrdParams): Promise<KRD> => {
    logger.info("Converting TCX to KRD");

    const krd = await tcxReader(params.tcxString);

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

    logger.info("TCX to KRD conversion successful");
    return krd;
  };
