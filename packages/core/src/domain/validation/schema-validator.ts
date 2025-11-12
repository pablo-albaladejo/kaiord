import type { Logger } from "../../ports/logger";
import { krdSchema } from "../schemas/krd";

export type ValidationError = {
  field: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
};

export type SchemaValidator = {
  validate: (krd: unknown) => Array<ValidationError>;
};

export const createSchemaValidator = (logger: Logger): SchemaValidator => ({
  validate: (krd: unknown): Array<ValidationError> => {
    logger.debug("Validating KRD against schema");

    const result = krdSchema.safeParse(krd);

    if (result.success) {
      logger.debug("KRD validation successful");
      return [];
    }

    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
      expected: issue.code,
      actual: undefined,
    }));

    logger.warn("KRD validation failed", { errorCount: errors.length });
    return errors;
  },
});
