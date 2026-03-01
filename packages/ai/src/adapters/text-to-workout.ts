import { generateText, Output } from "ai";
import type { Workout } from "@kaiord/core";
import { workoutSchema, sportSchema } from "@kaiord/core";
import type { TextToWorkoutConfig, TextToWorkoutOptions } from "../types";
import { createAiParsingError } from "../errors";
import { validateInput } from "./validate-input";
import { reindexSteps } from "./reindex-steps";
import { loadPrompt } from "../prompts/load-prompt";
import systemPromptRaw from "../prompts/parse-workout.md";

const MAX_ERROR_LENGTH = 200;

const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const buildSystemPrompt = (
  raw: string,
  options?: TextToWorkoutOptions
): string => {
  const sportLine = options?.sport
    ? `The sport for this workout is "${options.sport}". Use it for the sport field.`
    : "";
  return loadPrompt(raw, { sport: sportLine });
};

const executeWithRetry = async (
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
        output: Output.object({ schema: workoutSchema }),
        system,
        prompt,
        maxOutputTokens,
        temperature,
      });

      if (!result.output) throw new Error("No structured output generated");

      logger?.debug("LLM raw output", { output: result.output });
      return reindexSteps(result.output);
    } catch (error) {
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
