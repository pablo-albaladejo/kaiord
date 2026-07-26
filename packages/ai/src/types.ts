import type { LanguageModel } from "ai";
import type { Logger, Sport } from "@kaiord/core";
import type { AiTelemetrySink } from "./observability/telemetry-types";

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
  // Optional telemetry sink forwarded to the underlying generate-mode runtime,
  // so a workout-generation run emits usage through the same port as agents.
  telemetry?: AiTelemetrySink;
};

export type TextToWorkoutOptions = {
  sport?: Sport;
  name?: string;
};
