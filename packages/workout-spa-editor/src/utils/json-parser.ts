/**
 * JSON Parser with Enhanced Error Messages
 *
 * Provides detailed error information including line and column numbers
 * when JSON parsing fails.
 */

import { FileParsingError } from "../types/errors";

/**
 * Parse JSON with enhanced error messages
 *
 * @param text - JSON string to parse
 * @returns Parsed JSON object
 * @throws FileParsingError with line and column information
 */
export const parseJSON = <T = unknown>(text: string): T => {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Try to extract position from error message
      // Different engines format this differently:
      // - V8: "Unexpected token i in JSON at position 35"
      // - SpiderMonkey: "JSON.parse: unexpected character at line 3 column 12"
      const positionMatch = error.message.match(/position (\d+)/);
      const lineColumnMatch = error.message.match(/line (\d+) column (\d+)/);

      if (positionMatch) {
        const position = Number.parseInt(positionMatch[1], 10);
        const { line, column } = getLineAndColumn(text, position);
        throw new FileParsingError(
          `Invalid JSON: ${error.message}`,
          line,
          column,
          error
        );
      }

      if (lineColumnMatch) {
        const line = Number.parseInt(lineColumnMatch[1], 10);
        const column = Number.parseInt(lineColumnMatch[2], 10);
        throw new FileParsingError(
          `Invalid JSON: ${error.message}`,
          line,
          column,
          error
        );
      }

      // If we can't extract position, return undefined for line and column
      throw new FileParsingError(
        `Invalid JSON: ${error.message}`,
        undefined,
        undefined,
        error
      );
    }
    throw new FileParsingError(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      undefined,
      error
    );
  }
};

/**
 * Get line and column number from character position
 */
const getLineAndColumn = (
  text: string,
  position: number
): { line: number; column: number } => {
  const lines = text.substring(0, position).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
};
