/**
 * File Parser Error Fallback Handlers
 *
 * Fallback error handlers for generic and unrecoverable errors.
 */

import type { ValidationError } from "../../../types/krd";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

export const createFileParsingErrorState = (error: {
  message: string;
  line?: number;
  column?: number;
}): ErrorState => {
  let message = `Failed to parse JSON: ${error.message}`;
  const positionMatch = error.message.match(/position (\d+)/i);
  const positionText = positionMatch ? ` at position ${positionMatch[1]}` : "";
  if (error.line !== undefined && error.column !== undefined) {
    message = `Failed to parse JSON${positionText} (line ${error.line}, column ${error.column})`;
  } else if (error.line !== undefined) {
    message = `Failed to parse JSON${positionText} (line ${error.line})`;
  } else if (positionText) {
    message = `Failed to parse JSON${positionText}`;
  }
  return {
    title: "Invalid File Format",
    message,
  };
};

export const createSyntaxErrorState = (error: SyntaxError): ErrorState => {
  let message = `Failed to parse JSON: ${error.message}`;
  const positionMatch = error.message.match(/position (\d+)/i);

  if (positionMatch) {
    message += `. Please check your file and try again.`;
  }

  return {
    title: "Invalid File Format",
    message,
  };
};

export const createUnrecoverableErrorState = (error: Error): ErrorState => {
  return {
    title: "Import Failed",
    message: `${error.message}. Please check your file and try again.`,
  };
};

export const createGenericErrorState = (error: unknown): ErrorState => {
  return {
    title: "File Read Error",
    message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}. Please check your file and try again.`,
  };
};
