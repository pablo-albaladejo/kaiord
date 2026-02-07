import type { Logger } from "@kaiord/core";
import type { ZwiftValidationResult, ZwiftValidator } from "@kaiord/core";
import { createWellFormednessValidator } from "./well-formedness-validator";
import { validateXmlWellFormedness } from "./xml-well-formedness-validator";
import { validateAgainstXsdSchema } from "./xsd-schema-validator";

// Detect browser environment before attempting to load Node.js modules
// Use a type-safe check that works in both Node.js and browser environments
const isBrowser = ((): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof (globalThis as any).window !== "undefined";
  } catch {
    return false;
  }
})();

/**
 * Creates a Zwift validator that automatically chooses the appropriate validation strategy:
 * - In Node.js: Full XSD schema validation
 * - In browsers: XML well-formedness validation only
 *
 * This ensures the library works in both environments without requiring separate builds.
 *
 * @param logger - Logger instance for diagnostic messages
 * @returns ZwiftValidator function
 */
export const createZwiftValidator = (logger: Logger): ZwiftValidator => {
  if (isBrowser) {
    logger.info(
      "Browser environment detected, using well-formedness validation for Zwift XML (XSD validation not available)"
    );
    return createWellFormednessValidator(logger);
  }

  return createXsdZwiftValidator(logger);
};

/**
 * Creates a Zwift validator with full XSD schema validation.
 * Only available in Node.js environments.
 *
 * @param logger - Logger instance for diagnostic messages
 * @returns ZwiftValidator function with XSD validation
 */
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
