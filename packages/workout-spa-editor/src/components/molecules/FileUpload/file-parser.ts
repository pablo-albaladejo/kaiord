/**
 * File Parsing Utilities
 */

import type { KRD, ValidationError } from "../../../types/krd";
import { getFormatName } from "../../../utils/file-format-metadata";
import { ImportError, importWorkout } from "../../../utils/import-workout";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

export type ImportProgressCallback = (progress: number) => void;

export const parseFile = async (
  file: File,
  onProgress?: ImportProgressCallback
): Promise<KRD> => {
  return await importWorkout(file, onProgress);
};

export const createParseError = (error: unknown): ErrorState => {
  if (error && typeof error === "object" && "title" in error) {
    return error as ErrorState;
  }

  if (error instanceof ImportError) {
    const formatName = error.format ? getFormatName(error.format) : "file";
    return {
      title: "Import Failed",
      message: `Failed to import ${formatName} file: ${error.message}`,
    };
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
