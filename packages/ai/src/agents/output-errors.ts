import { NoObjectGeneratedError } from "ai";

/**
 * An output that hit the token limit is incomplete JSON, or a valid prefix of
 * the intended answer; either way it must not reach validation, which would
 * report a misleading schema error. A typed error lets the loop tell the user
 * (and the model, in the retry feedback) what actually went wrong.
 */
export class AiOutputTruncatedError extends Error {
  constructor() {
    super(
      "The output was cut off at the token limit before it was complete. " +
        "Return the complete JSON and keep every text field short."
    );
    this.name = "AiOutputTruncatedError";
  }
}

/**
 * A complete output that did not parse or validate. Marking it positively
 * keeps every other failure (a dropped connection, a malformed provider
 * response) from being reported as the model's fault.
 */
export class AiOutputInvalidError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "AiOutputInvalidError";
  }
}

export const throwIfTruncated = (finishReason: string | undefined): void => {
  if (finishReason === "length") throw new AiOutputTruncatedError();
};

/**
 * The SDK parses the structured output before it returns, so a reply cut at
 * the token limit usually surfaces as a parse failure carrying the finish
 * reason, not as a result we could inspect.
 */
export const toOutputError = (error: unknown): unknown => {
  if (!NoObjectGeneratedError.isInstance(error)) return error;
  if (error.finishReason === "length") return new AiOutputTruncatedError();
  return new AiOutputInvalidError(error.message, error);
};
