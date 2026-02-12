import { krdSchema } from "../schemas/krd";
import type { ValidationError } from "../types/error-types";

export type SchemaValidator = {
  validate: (krd: unknown) => Array<ValidationError>;
};

export const createSchemaValidator = (): SchemaValidator => ({
  validate: (krd: unknown): Array<ValidationError> => {
    const result = krdSchema.safeParse(krd);

    if (result.success) {
      return [];
    }

    return result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "root",
      message: issue.message,
      expected: issue.code,
      actual: undefined,
    }));
  },
});
