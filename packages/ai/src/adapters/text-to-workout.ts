import type { Workout } from "@kaiord/core";
import { sportSchema } from "@kaiord/core";
import type { TextToWorkoutConfig, TextToWorkoutOptions } from "../types";
import { validateInput } from "./validate-input";
import { loadPrompt } from "../prompts/load-prompt";
import { executeWithRetry } from "./execute-with-retry";
import systemPromptRaw from "../prompts/parse-workout.md";

const buildSystemPrompt = (
  raw: string,
  options?: TextToWorkoutOptions
): string => {
  const sportLine = options?.sport
    ? `The sport for this workout is "${options.sport}". Use it for the sport field.`
    : "";
  return loadPrompt(raw, { sport: sportLine });
};

/**
 * Creates a function that converts natural language text into a typed Workout.
 *
 * No pre-built singleton is exported because `model` is required.
 * The consumer provides a LanguageModel from their chosen AI SDK provider.
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
    const system = buildSystemPrompt(systemPromptRaw, options);

    logger?.debug("System prompt prepared", { length: system.length });
    logger?.info("Parsing workout text", { length: sanitized.length });

    const workout = await executeWithRetry(
      model,
      system,
      sanitized,
      maxRetries,
      maxOutputTokens,
      temperature,
      logger
    );

    if (options?.name) workout.name = options.name;

    logger?.info("Workout parsed", { steps: workout.steps.length });
    return workout;
  };
};
