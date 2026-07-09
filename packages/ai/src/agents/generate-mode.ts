import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";
import type { AgentDefinition, GenerateAgentInput } from "./definition-types";
import type { AiUsage } from "../observability/telemetry-types";
import { buildUserMessage } from "./build-user-message";
import {
  isAbortError,
  isNonRetryableTransport,
  MAX_ERROR_LENGTH,
  truncate,
} from "./retry-policy";
import { createAiAgentError } from "./errors";

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

export type GenerateOutcome<TOutput> = { output: TOutput; usage?: AiUsage };

export type GenerateLoopArgs<TOutput> = {
  model: LanguageModel;
  system: string;
  input: GenerateAgentInput;
  definition: AgentDefinition<TOutput>;
  signal?: AbortSignal;
  onAttemptError?: (attempt: number, message: string) => void;
};

const toUsage = (raw: {
  inputTokens?: number;
  outputTokens?: number;
}): AiUsage => ({
  promptTokens: raw?.inputTokens ?? 0,
  completionTokens: raw?.outputTokens ?? 0,
});

// `validate`, when present, owns validation and receives the RAW model output
// (so an agent whose wire schema is permissive can validate against a stricter
// domain schema). Otherwise the wire `outputSchema` is the gate.
const validateOutput = <TOutput>(
  definition: AgentDefinition<TOutput>,
  raw: unknown
): TOutput =>
  definition.validate
    ? definition.validate(raw)
    : (definition.outputSchema.parse(raw) as TOutput);

const callModel = async <TOutput>(
  args: GenerateLoopArgs<TOutput>,
  feedback?: string
): Promise<GenerateOutcome<TOutput>> => {
  const { model, system, input, definition, signal } = args;
  const result = await generateText({
    model,
    output: Output.object({ schema: definition.outputSchema }),
    system,
    messages: [buildUserMessage(input, feedback)],
    maxOutputTokens: definition.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    temperature: definition.temperature ?? 0,
    maxRetries: 0,
    abortSignal: signal,
  });
  if (!result.output) throw new Error("No structured output generated");
  return {
    output: validateOutput(definition, result.output),
    usage: toUsage(result.usage),
  };
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
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    args.signal?.throwIfAborted();
    try {
      return await callModel(args, lastError);
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
