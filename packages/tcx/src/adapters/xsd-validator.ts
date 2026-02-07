import { XMLValidator } from "fast-xml-parser";
import type { Logger } from "@kaiord/core";
import type { TcxValidationResult, TcxValidator } from "@kaiord/core";

export const createXsdTcxValidator =
  (logger: Logger): TcxValidator =>
  async (xmlString: string): Promise<TcxValidationResult> => {
    try {
      logger.debug("Validating TCX XML structure");

      // Validate XML structure using fast-xml-parser
      const xmlValidation = XMLValidator.validate(xmlString, {
        allowBooleanAttributes: true,
      });

      if (xmlValidation !== true) {
        logger.warn("TCX XML validation failed", {
          error: xmlValidation.err,
        });

        return {
          valid: false,
          errors: [
            {
              path: `line ${xmlValidation.err.line}`,
              message: `XML validation failed: ${xmlValidation.err.msg}`,
            },
          ],
        };
      }

      logger.info("TCX XML structure is valid");
      return { valid: true, errors: [] };
    } catch (error) {
      logger.error("TCX validation failed", { error });

      return {
        valid: false,
        errors: [
          {
            path: "root",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  };
