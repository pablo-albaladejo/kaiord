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

/** One pace zone in metres per second; `minMps` is the slower bound. */
export type PaceZoneBounds = { zone: number; minMps: number; maxMps: number };

/** One power zone in watts. */
export type PowerZoneBounds = {
  zone: number;
  minWatts: number;
  maxWatts: number;
};

/**
 * The athlete's zones as numbers. Zone targets the model emits are resolved
 * against these in code; a missing power zone stays a zone, a missing pace
 * zone becomes `open`.
 */
export type AthleteZoneTables = {
  pace?: Array<PaceZoneBounds>;
  power?: Array<PowerZoneBounds>;
};

export type AthleteContext = {
  /** Human-readable zones shown to the model. */
  zonesText?: string;
  /** The athlete's own instructions for the AI (capped). */
  instructions?: string;
  /** Numeric tables for deterministic zone resolution. */
  zones?: AthleteZoneTables;
};

export type TextToWorkoutOptions = {
  sport?: Sport;
  name?: string;
  athlete?: AthleteContext;
};
