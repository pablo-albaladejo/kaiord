/**
 * The one place that chooses how a Coaching Activity's Workout is built.
 *
 * - The activity has a steps table and no Athlete note: the table is read
 *   again, without the AI (no call, no bill).
 * - Otherwise the AI builds it from the coach's text, the table when there
 *   is one, and the note.
 *
 * `readStepsTable` is the seam for the Train2Go steps table (#1684),
 * implemented by `read-steps-table.ts`; without it every activity goes to
 * the AI. No other code decides between the table and the AI.
 */
import type { AiMeta } from "../../types/calendar-fragments";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import { forceKrdSport, type ResolvedSport } from "./coaching-krd-sport";
import { buildCoachingPromptText } from "./coaching-prompt-text";
import type { GenerateKrdPort } from "./convert-coaching-activity-with-ai-types";

/** A steps table read from the activity: its Workout, and its text for the AI. */
export type StepsTable = { krd: KRD; text: string };

export type ReadStepsTable = (
  activity: CoachingActivityRecord
) => StepsTable | null;

/** `aiMeta` is null when the AI took no part (the table was read). */
export type CoachingBuild = { krd: KRD; aiMeta: AiMeta | null };

export type CoachingBuilder = (
  abortSignal?: AbortSignal
) => Promise<CoachingBuild>;

export type BuilderDeps = {
  generateKrd: GenerateKrdPort;
  readStepsTable?: ReadStepsTable;
};

/**
 * `resolved` is the KRD sport the activity's key resolves to: the AI gets it
 * as its hint (raw Train2Go keys make it guess `generic`) and every build
 * carries it, so a known sport is never persisted as a guess.
 */
export const chooseCoachingBuilder = (
  deps: BuilderDeps,
  activity: CoachingActivityRecord,
  note: string | undefined,
  resolved: ResolvedSport | null
): CoachingBuilder => {
  const inSport = (krd: KRD) => (resolved ? forceKrdSport(krd, resolved) : krd);
  const table = deps.readStepsTable?.(activity) ?? null;
  if (table && !note)
    return async () => ({ krd: inSport(table.krd), aiMeta: null });
  const text = buildCoachingPromptText(activity, note, table?.text);
  const sport = resolved?.sport ?? activity.sport;
  return async (abortSignal) => {
    const built = await deps.generateKrd({ text, sport, abortSignal });
    return { krd: inSport(built.krd), aiMeta: built.aiMeta };
  };
};
