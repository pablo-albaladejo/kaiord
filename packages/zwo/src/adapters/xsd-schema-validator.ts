import { loadNodeModules } from "./node-modules-loader";
import type { ZwiftValidationResult } from "../types";
import type { Logger } from "@kaiord/core";

export const validateAgainstXsdSchema = async (
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
