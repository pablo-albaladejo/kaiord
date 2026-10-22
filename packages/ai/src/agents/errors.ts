/**
 * Typed error raised when a generate run exhausts its retry budget. Carries
 * the attempt count and the last underlying failure, kept as `cause`, so
 * callers (and deprecated wrappers) can map it to their own domain error.
 */
export class AiAgentError extends Error {
  readonly code = "AI_AGENT_ERROR" as const;
  readonly attempts: number;
  readonly lastError?: string;

  constructor(
    message: string,
    attempts: number,
    lastError?: string,
    cause?: unknown
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "AiAgentError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export const createAiAgentError = (
  message: string,
  attempts: number,
  lastError?: string,
  cause?: unknown
): AiAgentError => new AiAgentError(message, attempts, lastError, cause);
