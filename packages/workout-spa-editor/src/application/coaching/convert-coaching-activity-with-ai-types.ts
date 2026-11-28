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
import type { GenerateStepNotesPort } from "./table-step-notes";

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
  /** Adds the step notes to a Workout read from a steps table. */
  generateStepNotes: GenerateStepNotesPort;
  /** Reads the activity's steps table; `null` when it has none. */
  readStepsTable: ReadStepsTable;
  newWorkoutId: () => string;
  newMatchId: () => string;
  clock: () => string;
};

export type ConvertWithAiResult =
  | {
      ok: true;
      workoutId: string;
      created: boolean;
      /** The Workout was built without its step notes: the notes call failed. */
      stepNotesFailed?: true;
    }
  | { ok: false; reason: AiFailureReason | "not-found"; error?: string };
