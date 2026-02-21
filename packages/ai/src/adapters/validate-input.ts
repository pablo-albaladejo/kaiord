import { createAiParsingError } from "../errors";

const MAX_INPUT_LENGTH = 2000;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Validates and sanitizes user input before sending to the LLM.
 * Strips control characters (keeps newlines and tabs).
 * Throws AiParsingError on empty or too-long input.
 */
export const validateInput = (text: string): string => {
  const sanitized = text.replace(CONTROL_CHARS, "").trim();

  if (sanitized.length === 0) {
    throw createAiParsingError("Input text is empty", text, 0);
  }

  if (sanitized.length > MAX_INPUT_LENGTH) {
    throw createAiParsingError(
      `Input text exceeds ${MAX_INPUT_LENGTH} characters (got ${sanitized.length})`,
      text,
      0
    );
  }

  return sanitized;
};
