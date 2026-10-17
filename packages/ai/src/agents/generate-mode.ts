import { UnsupportedFunctionalityError } from "ai";
import {
  isAbortError,
  isNonRetryableTransport,
  MAX_ERROR_LENGTH,
  truncate,
} from "./retry-policy";
import { createAiAgentError } from "./errors";
import {
  callModel,
  streamModel,
  type CallModelArgs,
  type GenerateOutcome,
  type ReportPhase,
} from "./call-model";
import { createProgressEmitter, type OnGenerateProgress } from "./progress";

const DEFAULT_MAX_RETRIES = 2;

export type { GenerateOutcome };

export type GenerateLoopArgs<TOutput> = CallModelArgs<TOutput> & {
  onAttemptError?: (attempt: number, message: string) => void;
  /** When set, output streams and each phase change is reported. */
  onProgress?: OnGenerateProgress;
};

type Mode = { streaming: boolean };

// A model that cannot stream falls back to one-shot generation for this and
// every later attempt; the run then reports phases without an item count.
const callOnce = async <TOutput>(
  args: GenerateLoopArgs<TOutput>,
  feedback: string | undefined,
  mode: Mode,
  report: ReportPhase
): Promise<GenerateOutcome<TOutput>> => {
  if (!mode.streaming) return callModel(args, feedback);
  try {
    return await streamModel(args, feedback, report);
  } catch (error) {
    if (!UnsupportedFunctionalityError.isInstance(error)) throw error;
    mode.streaming = false;
    return callModel(args, feedback);
  }
};

/**
 * Structured-output generation with a validate-and-retry-with-feedback loop.
 * Non-retryable transport errors and aborts propagate immediately; exhaustion
 * raises a typed `AiAgentError` carrying the attempt count.
 */
export const runGenerateLoop = async <TOutput>(
  args: GenerateLoopArgs<TOutput>
): Promise<GenerateOutcome<TOutput>> => {
  const maxRetries = args.definition.maxRetries ?? DEFAULT_MAX_RETRIES;
  const emit = createProgressEmitter(args.onProgress, maxRetries + 1);
  const mode: Mode = { streaming: args.onProgress !== undefined };
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    args.signal?.throwIfAborted();
    emit({ phase: "requesting", attempt });
    try {
      return await callOnce(args, lastError, mode, (phase, items) =>
        emit({ phase, attempt, items })
      );
    } catch (error) {
      if (isNonRetryableTransport(error) || isAbortError(error)) throw error;
      lastError = error instanceof Error ? error.message : String(error);
      args.onAttemptError?.(attempt, lastError);
      if (attempt > maxRetries) {
        throw createAiAgentError(
          `Failed after ${attempt} attempts: ${truncate(lastError, MAX_ERROR_LENGTH)}`,
          attempt,
          truncate(lastError, MAX_ERROR_LENGTH)
        );
      }
    }
  }
  throw createAiAgentError("Unexpected error", maxRetries + 1);
};
