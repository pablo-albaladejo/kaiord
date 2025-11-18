import { XMLValidator } from "fast-xml-parser";
import type { Logger } from "../../ports/logger";
import type {
  ZwiftValidationResult,
  ZwiftValidator,
} from "../../ports/zwift-validator";

export const createXsdZwiftValidator =
  (logger: Logger): ZwiftValidator =>
  async (xmlString: string): Promise<ZwiftValidationResult> => {
    try {
      logger.debug("Validating Zwift XML structure");

      // Validate XML structure using fast-xml-parser
      const xmlValidation = XMLValidator.validate(xmlString, {
        allowBooleanAttributes: true,
      });

      if (xmlValidation !== true) {
        logger.warn("Zwift XML validation failed", {
          error: xmlValidation.err,
        });

        return {
          valid: false,
          errors: [
            {
              field: `line ${xmlValidation.err.line}`,
              message: `XML validation failed: ${xmlValidation.err.msg}`,
            },
          ],
        };
      }

      logger.info("Zwift XML structure is valid");
      return { valid: true, errors: [] };
    } catch (error) {
      logger.error("Zwift validation failed", { error });

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
