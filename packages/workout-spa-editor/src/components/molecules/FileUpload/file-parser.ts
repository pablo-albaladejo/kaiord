/**
 * File Parsing Utilities
 */

import type { KRD, ValidationError } from "../../../types/krd";
import { krdSchema } from "../../../types/schemas";
import { formatZodError } from "../../../types/validation";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

export const parseFile = async (file: File): Promise<unknown> => {
  const text = await file.text();
  return JSON.parse(text);
};

export const validateKRD = (data: unknown): KRD => {
  const result = krdSchema.safeParse(data);

  if (!result.success) {
    const validationErrors = formatZodError(result.error);
    throw {
      title: "Validation Failed",
      message:
        "File validation failed. Please check that the file is a valid KRD format.",
      validationErrors,
    };
  }

  return result.data;
};

export const createParseError = (error: unknown): ErrorState => {
  if (error && typeof error === "object" && "title" in error) {
    return error as ErrorState;
  }

  if (error instanceof SyntaxError) {
    return {
      title: "Invalid File Format",
      message: `Failed to parse JSON: ${error.message}`,
    };
  }

  return {
    title: "File Read Error",
    message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
  };
};
