/**
 * File Parsing Utilities
 */

import type { KRD, ValidationError } from "../../../types/krd";
import { ImportError, importWorkout } from "../../../utils/import-workout";
import { createImportErrorState } from "./file-parser-error-builders";
import {
  createFileParsingErrorState,
  createGenericErrorState,
  createSyntaxErrorState,
  createUnrecoverableErrorState,
} from "./file-parser-error-fallbacks";

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
    return createImportErrorState(error);
  }

  // Handle FileParsingError directly (from json-parser)
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "FileParsingError" &&
    "message" in error
  ) {
    const parsingError = error as {
      message: string;
      line?: number;
      column?: number;
    };
    return createFileParsingErrorState(parsingError);
  }

  if (error instanceof SyntaxError) {
    return createSyntaxErrorState(error);
  }

  // For unrecoverable errors (like corrupted FIT files), add helpful message
  if (
    error instanceof Error &&
    (error.message.includes("corrupted") ||
      error.message.includes("not a FIT file") ||
      error.message.includes("input is not a FIT file"))
  ) {
    return createUnrecoverableErrorState(error);
  }

  return createGenericErrorState(error);
};
