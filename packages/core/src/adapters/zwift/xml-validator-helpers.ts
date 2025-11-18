import {
  createZwiftParsingError,
  createZwiftValidationError,
} from "../../domain/types/errors";
import type { Logger } from "../../ports/logger";
import type { ZwiftValidator } from "../../ports/zwift-validator";

export const validateInputZwiftXml = async (
  xmlString: string,
  validator: ZwiftValidator,
  logger: Logger
): Promise<void> => {
  logger.debug("Validating Zwift file against XSD", {
    xmlLength: xmlString.length,
  });

  const validationResult = await validator(xmlString);
  if (!validationResult.valid) {
    logger.error("Zwift file does not conform to XSD schema", {
      errors: validationResult.errors,
    });
    throw createZwiftValidationError(
      "Zwift file does not conform to XSD schema",
      validationResult.errors
    );
  }
};

export const validateGeneratedZwiftXml = async (
  xmlString: string,
  validator: ZwiftValidator,
  logger: Logger
): Promise<void> => {
  logger.debug("Validating generated Zwift XML against XSD", {
    xmlLength: xmlString.length,
  });

  const validationResult = await validator(xmlString);
  if (!validationResult.valid) {
    logger.error("Generated Zwift XML does not conform to XSD schema", {
      errors: validationResult.errors,
    });
    throw createZwiftValidationError(
      "Generated Zwift XML does not conform to XSD schema",
      validationResult.errors
    );
  }
};

export const validateZwiftStructure = (
  zwiftData: unknown,
  logger: Logger
): void => {
  if (
    !zwiftData ||
    typeof zwiftData !== "object" ||
    !("workout_file" in zwiftData)
  ) {
    const error = createZwiftParsingError(
      "Invalid Zwift format: missing workout_file element"
    );
    logger.error("Invalid Zwift structure", { error });
    throw error;
  }
};
