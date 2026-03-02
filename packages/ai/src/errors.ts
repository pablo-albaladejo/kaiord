export class AiParsingError extends Error {
  readonly code = "AI_PARSING_ERROR" as const;
  readonly inputText: string;
  readonly attempts: number;
  readonly lastError?: string;

  constructor(
    message: string,
    inputText: string,
    attempts: number,
    lastError?: string
  ) {
    super(message);
    this.name = "AiParsingError";
    this.inputText = inputText;
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export const createAiParsingError = (
  message: string,
  inputText: string,
  attempts: number,
  lastError?: string
): AiParsingError =>
  new AiParsingError(message, inputText, attempts, lastError);
