import type { Logger } from "@kaiord/core";
import type { ZwiftValidator } from "../types";
import { createWellFormednessValidator } from "./well-formedness-validator";

/**
 * Creates a Zwift validator for browser environments.
 * Only performs XML well-formedness validation (XSD validation not available in browsers).
 *
 * @param logger - Logger instance for diagnostic messages
 * @returns ZwiftValidator function
 */
export const createZwiftValidator = (logger: Logger): ZwiftValidator => {
  logger.info(
    "Browser environment detected, using well-formedness validation for Zwift XML (XSD validation not available)"
  );
  return createWellFormednessValidator(logger);
};
