import type { Analytics } from "@kaiord/core";

import type { AthleteNoteRepository } from "../../ports/athlete-note-repository";
import type {
  CoachingRepository,
  PersistencePort,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { AiMeta } from "../../types/calendar-fragments";
import type { KRD } from "../../types/schemas";
import type { ReadStepsTable } from "./choose-coaching-builder";
import type { AiFailureReason } from "./convert-coaching-activity-error-mapper";

export type ConvertWithAiInput = {
  activityId: string;
  abortSignal?: AbortSignal;
  /** Rebuild an existing Workout in place: explicit, billed when the AI builds it. */
  regenerate?: boolean;
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
  athleteNotes: Pick<AthleteNoteRepository, "getById">;
  transaction: PersistencePort["transaction"];
  analytics: Analytics;
  generateKrd: GenerateKrdPort;
  /** Reads the activity's steps table; `null` when it has none. */
  readStepsTable: ReadStepsTable;
  newWorkoutId: () => string;
  newMatchId: () => string;
  clock: () => string;
};

export type ConvertWithAiResult =
  | { ok: true; workoutId: string; created: boolean }
  | { ok: false; reason: AiFailureReason | "not-found"; error?: string };
