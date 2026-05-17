import { generateText, Output } from "ai";
import type { Workout } from "@kaiord/core";
import { workoutSchema } from "@kaiord/core";
import type { TextToWorkoutConfig } from "../types";
import { createAiParsingError } from "../errors";
import { reindexSteps } from "./reindex-steps";
import { aiWorkoutSchema } from "./ai-workout-schema";

const MAX_ERROR_LENGTH = 200;

const HTTP_REQUEST_TIMEOUT = 408;
const HTTP_TOO_MANY_REQUESTS = 429;

const isNonRetryableTransport = (error: unknown): boolean => {
  const status = (error as { statusCode?: unknown })?.statusCode;
  if (typeof status !== "number") return false;
  if (status < 400 || status >= 500) return false;
  return status !== HTTP_REQUEST_TIMEOUT && status !== HTTP_TOO_MANY_REQUESTS;
};

const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;

/**
 * Execute LLM generation with retry logic on validation failures.
 */
export const executeWithRetry = async (
  model: TextToWorkoutConfig["model"],
  system: string,
  sanitized: string,
  maxRetries: number,
  maxOutputTokens: number,
  temperature: number,
  logger: TextToWorkoutConfig["logger"]
): Promise<Workout> => {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const prompt = lastError
        ? `${sanitized}\n\n[Previous attempt failed: ${truncate(lastError, MAX_ERROR_LENGTH)}. Fix the errors.]`
        : sanitized;

      const result = await generateText({
        model,
        output: Output.object({ schema: aiWorkoutSchema }),
        system,
        prompt,
        maxOutputTokens,
        temperature,
        // Disable the AI SDK's internal retry layer. We already own the
        // retry loop (`for (attempt = 1..maxRetries+1)`) and the catch
        // gate above; without this, a retryable APICallError costs
        // SDK-retries × executeWithRetry-attempts HTTP calls per user
        // click instead of a single one per visible attempt.
        maxRetries: 0,
      });

      if (!result.output) throw new Error("No structured output generated");

      const validated = workoutSchema.parse(result.output);
      logger?.debug("LLM raw output", { output: validated });
      return reindexSteps(validated);
    } catch (error) {
      if (isNonRetryableTransport(error)) {
        throw error;
      }
      lastError = error instanceof Error ? error.message : String(error);
      logger?.warn("Parse attempt failed", { attempt, error: lastError });

      if (attempt > maxRetries) {
        throw createAiParsingError(
          `Failed after ${attempt} attempts: ${truncate(lastError, MAX_ERROR_LENGTH)}`,
          truncate(sanitized, MAX_ERROR_LENGTH),
          attempt,
          truncate(lastError, MAX_ERROR_LENGTH)
        );
      }
    }
  }

  throw createAiParsingError("Unexpected error", "", maxRetries + 1);
};
