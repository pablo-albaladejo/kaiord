/**
 * File Parsing Utilities
 */

import type { KRD, ValidationError } from "../../../types/krd";
import { krdSchema } from "../../../types/schemas";
import { formatZodError } from "../../../types/validation";
import {
  detectFormat,
  getFormatName,
} from "../../../utils/file-format-detector";
import { importWorkout } from "../../../utils/import-workout";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

export const parseFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  const format = detectFormat(file.name);

  if (!format) {
    throw {
      title: "Unsupported Format",
      message: "Supported formats: .fit, .tcx, .pwx, .krd, .json",
    };
  }

  try {
    const krd = await importWorkout(file, onProgress);
    return validateKRD(krd);
  } catch (error) {
    // If it's already a structured error (like validation error), re-throw it
    if (error && typeof error === "object" && "title" in error) {
      throw error;
    }

    throw {
      title: `${getFormatName(format)} Import Failed`,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
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
