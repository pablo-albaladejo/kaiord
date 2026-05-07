/**
 * Public-by-re-export type surface for `convertCoachingActivityWithAi`.
 * Lives in its own module so the orchestrator and helpers files can
 * each import only what they need without busting the per-file line
 * cap.
 */
import type { Analytics } from "@kaiord/core";

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { AiMeta } from "../../types/calendar-fragments";
import type { KRD } from "../../types/schemas";
import type { AiFailureReason } from "./convert-coaching-activity-error-mapper";

export type ConvertWithAiInput = {
  activityId: string;
  abortSignal?: AbortSignal;
};

export type GenerateKrdPort = (input: {
  text: string;
  sport: string;
  abortSignal?: AbortSignal;
}) => Promise<{ krd: KRD; aiMeta: AiMeta }>;

export type ConvertWithAiDeps = {
  coaching: CoachingRepository;
  workouts: WorkoutRepository;
  sessionMatches: SessionMatchRepository;
  analytics: Analytics;
  generateKrd: GenerateKrdPort;
  newWorkoutId: () => string;
  newMatchId: () => string;
  clock: () => string;
};

export type ConvertWithAiResult =
  | { ok: true; workoutId: string; created: boolean }
  | { ok: false; reason: AiFailureReason | "not-found"; error?: string };
