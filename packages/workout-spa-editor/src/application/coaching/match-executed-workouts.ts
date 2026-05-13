/**
 * Auto-match use case for the Train2Go three-slot grouping.
 *
 * For every existing `sessionMatch`, scan the workouts collection and
 * pick up executed activities (e.g., Garmin/FIT recordings) on the same
 * `(profileId, date, canonical sport)` slot. The structured slot
 * (`match.workoutId`) and any already-appended executed are skipped.
 *
 * Pure: no IO, no clock — caller supplies the slice already filtered
 * to the relevant week and computes the canonical sport via the
 * injected `canonicalSport` function. Returns the per-match list of
 * workout ids to append; the caller persists via the repo helper.
 */

import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatch } from "../../types/session-match";

const TRAIN2GO = "train2go";

export type MatchExecutedWorkoutsInput = {
  sessionMatches: readonly SessionMatch[];
  workouts: readonly WorkoutRecord[];
  /** Returns the canonical sport key or `null` for "unknown — skip". */
  canonicalSport: (raw: string) => string | null;
};

export type MatchExecutedWorkoutsAppend = {
  matchId: string;
  toAppend: string[];
};

const isExecuted = (w: WorkoutRecord): boolean => w.source !== TRAIN2GO;

const buildAppendsForMatch = (
  match: SessionMatch,
  executedByDate: ReadonlyMap<string, WorkoutRecord[]>,
  matchCanonical: string,
  canonicalSport: (raw: string) => string | null
): string[] => {
  const candidates = executedByDate.get(match.date) ?? [];
  const taken = new Set<string>([match.workoutId, ...match.executedWorkoutIds]);
  const toAppend: string[] = [];
  for (const w of candidates) {
    if (taken.has(w.id)) continue;
    if (canonicalSport(w.sport) !== matchCanonical) continue;
    toAppend.push(w.id);
    taken.add(w.id);
  }
  return toAppend;
};

const indexByDate = (
  workouts: readonly WorkoutRecord[]
): Map<string, WorkoutRecord[]> => {
  const out = new Map<string, WorkoutRecord[]>();
  for (const w of workouts) {
    if (!isExecuted(w)) continue;
    const bucket = out.get(w.date) ?? [];
    bucket.push(w);
    out.set(w.date, bucket);
  }
  return out;
};

const resolveMatchCanonical = (
  match: SessionMatch,
  workouts: readonly WorkoutRecord[],
  canonicalSport: (raw: string) => string | null
): string | null => {
  const structured = workouts.find((w) => w.id === match.workoutId);
  if (!structured) return null;
  return canonicalSport(structured.sport);
};

export const matchExecutedWorkouts = (
  input: MatchExecutedWorkoutsInput
): MatchExecutedWorkoutsAppend[] => {
  const executedByDate = indexByDate(input.workouts);
  const out: MatchExecutedWorkoutsAppend[] = [];
  for (const match of input.sessionMatches) {
    const matchCanonical = resolveMatchCanonical(
      match,
      input.workouts,
      input.canonicalSport
    );
    if (!matchCanonical) continue;
    const toAppend = buildAppendsForMatch(
      match,
      executedByDate,
      matchCanonical,
      input.canonicalSport
    );
    if (toAppend.length > 0) out.push({ matchId: match.id, toAppend });
  }
  return out;
};
