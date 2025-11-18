import { XMLValidator } from "fast-xml-parser";
import type { Logger } from "../../ports/logger";
import type {
  ZwiftValidationResult,
  ZwiftValidator,
} from "../../ports/zwift-validator";

// Check if we're in a Node.js environment
// This check works in both Node.js and bundlers that polyfill process
const isNode =
  typeof process !== "undefined" &&
  (process.versions?.node || typeof process.env !== "undefined");

// Lazy load Node.js modules only when needed
let validateXML: ((xml: string, schema: string) => Promise<{
  valid: boolean;
  messages: string[];
  result?: string;
}>) | null = null;
let XSD_SCHEMA_PATH: string | null = null;

const loadNodeModules = async () => {
  if (!isNode) {
    throw new Error(
      "XSD validation is only available in Node.js environments"
    );
  }

  if (validateXML && XSD_SCHEMA_PATH) {
    return { validateXML, XSD_SCHEMA_PATH };
  }

  const { createRequire } = await import("module");
  const { dirname, join } = await import("path");
  const { fileURLToPath } = await import("url");

  const require = createRequire(import.meta.url);
  const { validateXML: validateXMLFn } = require("xsd-schema-validator") as {
    validateXML: (
      xml: string,
      schema: string
    ) => Promise<{
      valid: boolean;
      messages: string[];
      result?: string;
    }>;
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = join(__dirname, "../../../schema/zwift-workout.xsd");

  validateXML = validateXMLFn;
  XSD_SCHEMA_PATH = schemaPath;

  return { validateXML, XSD_SCHEMA_PATH };
};

const validateXmlWellFormedness = (
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

const validateAgainstXsdSchema = async (
  xmlString: string,
  logger: Logger
): Promise<ZwiftValidationResult | null> => {
  const { validateXML: validateXMLFn, XSD_SCHEMA_PATH: schemaPath } =
    await loadNodeModules();

  // validateXML expects file path, not file content
  const xsdValidationResult = await validateXMLFn(xmlString, schemaPath);

  if (!xsdValidationResult.valid) {
    logger.warn("Zwift XSD validation failed", {
      messages: xsdValidationResult.messages,
    });

    return {
      valid: false,
      errors: xsdValidationResult.messages.map((msg) => ({
        field: "schema",
        message: msg,
      })),
    };
  }

  return null;
};

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
