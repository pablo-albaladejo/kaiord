import type { KRD } from "../../domain/schemas/krd";
import { createFitParsingError } from "../../domain/types/errors";
import type { Logger } from "../../ports/logger";

export const convertKRDToMessages = (
  _krd: KRD,
  logger: Logger
): Array<unknown> => {
  logger.debug("Converting KRD to FIT messages");
  throw createFitParsingError("KRD to FIT conversion not yet implemented");
};
