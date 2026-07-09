import type { Workout } from "@kaiord/core";
import { sportSchema } from "@kaiord/core";
import type { TextToWorkoutConfig, TextToWorkoutOptions } from "../types";
import { validateInput } from "./validate-input";
import { runGenerateAgent } from "../agents/runtime";
import { createWorkoutParserAgent } from "../agents/workout-parser-agent";
import { AiAgentError } from "../agents/errors";
import { createAiParsingError } from "../errors";

const MAX_INPUT_ECHO = 200;

const sportLineFor = (options?: TextToWorkoutOptions): string =>
  options?.sport
    ? `The sport for this workout is "${options.sport}". Use it for the sport field.`
    : "";

const toDomainError = (error: unknown, inputText: string): unknown =>
  error instanceof AiAgentError
    ? createAiParsingError(
        error.message,
        inputText.slice(0, MAX_INPUT_ECHO),
        error.attempts,
        error.lastError
      )
    : error;

/**
 * Converts natural-language text into a typed Workout.
 *
 * @deprecated Prefer `runGenerateAgent` from `@kaiord/ai/agents` with the
 * workout-parser definition. This wrapper preserves the original signature and
 * `AiParsingError` semantics while delegating to the shared runtime.
 */
export const createTextToWorkout = (config: TextToWorkoutConfig) => {
  const {
    model,
    logger,
    maxRetries = 2,
    maxOutputTokens = 4096,
    temperature = 0,
  } = config;

  return async (
    text: string,
    options?: TextToWorkoutOptions
  ): Promise<Workout> => {
    if (options?.sport) sportSchema.parse(options.sport);
    const sanitized = validateInput(text);
    const agent = {
      ...createWorkoutParserAgent(sportLineFor(options)),
      maxRetries,
      maxOutputTokens,
      temperature,
    };

    logger?.debug("Workout parse requested", { length: sanitized.length });
    logger?.info("Parsing workout text", { length: sanitized.length });

    try {
      const { output } = await runGenerateAgent(
        agent,
        { text: sanitized },
        { model, logger }
      );
      const workout = options?.name
        ? { ...output, name: options.name }
        : output;
      logger?.info("Workout parsed", { steps: workout.steps.length });
      return workout;
    } catch (error) {
      throw toDomainError(error, sanitized);
    }
  };
};
