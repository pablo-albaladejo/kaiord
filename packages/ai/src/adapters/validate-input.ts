import { truncate } from "../agents/retry-policy";
import { stripControlChars } from "../prompts/control-chars";
import { createAiParsingError } from "../errors";

const MAX_INPUT_LENGTH = 2000;
const MAX_ERROR_TEXT_LENGTH = 200;

/**
 * Validates and sanitizes user input before sending to the LLM.
 * Strips control characters (keeps newlines and tabs).
 * Throws AiParsingError on empty or too-long input.
 */
export const validateInput = (text: string): string => {
  const sanitized = stripControlChars(text).trim();

  if (sanitized.length === 0) {
    throw createAiParsingError(
      "Input text is empty",
      truncate(sanitized, MAX_ERROR_TEXT_LENGTH),
      0,
      undefined,
      { reason: "input_empty" }
    );
  }

  if (sanitized.length > MAX_INPUT_LENGTH) {
    throw createAiParsingError(
      `Input text exceeds ${MAX_INPUT_LENGTH} characters (got ${sanitized.length})`,
      truncate(sanitized, MAX_ERROR_TEXT_LENGTH),
      0,
      undefined,
      {
        reason: "input_too_long",
        details: {
          maxLength: MAX_INPUT_LENGTH,
          actualLength: sanitized.length,
        },
      }
    );
  }

  return sanitized;
};
