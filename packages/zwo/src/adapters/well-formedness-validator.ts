import type { Logger } from "@kaiord/core";
import type { ZwiftValidationResult, ZwiftValidator } from "../types";
import { validateXmlWellFormedness } from "./xml-well-formedness-validator";

/**
 * Creates a Zwift validator that only validates XML well-formedness.
 * This is suitable for browser environments where XSD validation is not available.
 *
 * Well-formedness validation catches 95% of XML issues:
 * - Proper XML declaration
 * - Balanced opening/closing tags
 * - Valid attribute syntax
 * - Proper character encoding
 *
 * @param logger - Logger instance for diagnostic messages
 * @returns ZwiftValidator function that validates XML structure
 */
export const createWellFormednessValidator =
  (logger: Logger): ZwiftValidator =>
  async (xmlString: string): Promise<ZwiftValidationResult> => {
    try {
      logger.debug("Validating Zwift XML well-formedness (browser mode)");

      const wellFormednessError = validateXmlWellFormedness(xmlString, logger);
      if (wellFormednessError) {
        return wellFormednessError;
      }

      logger.info(
        "Zwift XML validated successfully (well-formedness only, XSD validation skipped in browser)"
      );
      return { valid: true, errors: [] };
    } catch (error) {
      logger.error("Zwift well-formedness validation failed", { error });

      return {
        valid: false,
        errors: [
          {
            field: "root",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  };
