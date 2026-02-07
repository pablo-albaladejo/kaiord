import { XMLValidator } from "fast-xml-parser";
import type { Logger } from "@kaiord/core";
import type { ZwiftValidationResult } from "@kaiord/core";

export const validateXmlWellFormedness = (
  xmlString: string,
  logger: Logger
): ZwiftValidationResult | null => {
  const xmlValidation = XMLValidator.validate(xmlString, {
    allowBooleanAttributes: true,
  });

  if (xmlValidation !== true) {
    logger.warn("Zwift XML well-formedness validation failed", {
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

  return null;
};
