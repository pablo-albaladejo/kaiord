import { formatZodError } from "./formatters";
import type { ValidationResult } from "./validation-types";
import type { ZodType } from "zod";

export const validate = <T>(
  schema: ZodType<T>,
  data: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
    };
  }

  return {
    success: false,
    errors: formatZodError(result.error),
  };
};
