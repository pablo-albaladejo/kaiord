/** Stable, language-free sub-code for a localizable input-validation failure. */
export type AiParsingErrorReason = "input_empty" | "input_too_long";

export type AiParsingErrorOptions = {
  /** Specific stable reason; absent for generic/LLM parse failures. */
  reason?: AiParsingErrorReason;
  /** Structured params for the reason (e.g. `{ maxLength, actualLength }`). */
  details?: Record<string, number>;
};

export class AiParsingError extends Error {
  readonly code = "AI_PARSING_ERROR" as const;
  readonly inputText: string;
  readonly attempts: number;
  readonly lastError?: string;
  readonly reason?: AiParsingErrorReason;
  readonly details?: Record<string, number>;

  constructor(
    message: string,
    inputText: string,
    attempts: number,
    lastError?: string,
    options?: AiParsingErrorOptions
  ) {
    super(message);
    this.name = "AiParsingError";
    this.inputText = inputText;
    this.attempts = attempts;
    this.lastError = lastError;
    this.reason = options?.reason;
    this.details = options?.details;
  }
}

export const createAiParsingError = (
  message: string,
  inputText: string,
  attempts: number,
  lastError?: string,
  options?: AiParsingErrorOptions
): AiParsingError =>
  new AiParsingError(message, inputText, attempts, lastError, options);
