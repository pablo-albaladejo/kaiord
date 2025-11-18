import type { Logger } from "../../ports/logger";
import type {
  ZwiftValidationResult,
  ZwiftValidator,
} from "../../ports/zwift-validator";
import { validateXmlWellFormedness } from "./xml-well-formedness-validator";
import { validateAgainstXsdSchema } from "./xsd-schema-validator";

export const createXsdZwiftValidator =
  (logger: Logger): ZwiftValidator =>
  async (xmlString: string): Promise<ZwiftValidationResult> => {
    try {
      logger.debug("Validating Zwift XML structure");

      // Step 1: Validate XML well-formedness
      const wellFormednessError = validateXmlWellFormedness(xmlString, logger);
      if (wellFormednessError) {
        return wellFormednessError;
      }

      logger.debug(
        "XML well-formedness validated, proceeding with XSD validation"
      );

      // Step 2: Validate against XSD schema
      const xsdError = await validateAgainstXsdSchema(xmlString, logger);
      if (xsdError) {
        return xsdError;
      }

      logger.info("Zwift XML validated successfully against XSD schema");
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
