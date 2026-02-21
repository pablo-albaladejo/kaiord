import type { LanguageModel } from "ai";
import type { Logger, Sport } from "@kaiord/core";

/**
 * Configuration for the textToWorkout factory.
 *
 * Unlike other @kaiord adapters, no pre-built singleton is exported
 * because `model` is required and has no sensible default.
 * The consumer provides a LanguageModel from their chosen AI SDK provider.
 */
export type TextToWorkoutConfig = {
  model: LanguageModel;
  logger?: Logger;
  maxRetries?: number;
  maxOutputTokens?: number;
  temperature?: number;
};

export type TextToWorkoutOptions = {
  sport?: Sport;
  name?: string;
};
