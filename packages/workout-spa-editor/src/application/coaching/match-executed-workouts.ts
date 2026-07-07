/**
 * Auto-match use case for the Train2Go three-slot grouping.
 *
 * For every existing `sessionMatch`, pick up executed activities on the same
 * `(profileId, date, canonical sport)` slot. The executed side is the UNION
 * of the v27 `activities` table and the legacy heuristic ("a workout whose
 * source is not train2go") — the latter still covers historical data and the
 * transitional dual-written WorkoutRecords. See `match-executed-refs` for how
 * an activity resolves to its renderable id and dedups against the legacy scan
 * (no double-match of one event).
 *
 * Pure: no IO, no clock — the caller supplies the week slice and the
 * `canonicalSport` function. Returns the per-match ids to append.
 */

import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatch } from "../../types/session-match";
import {
  type CanonicalSport,
  type ExecutedRef,
  indexExecutedRefsByDate,
} from "./match-executed-refs";

export type MatchExecutedWorkoutsInput = {
  sessionMatches: readonly SessionMatch[];
  workouts: readonly WorkoutRecord[];
  /** Executed activities (v27); unioned with the legacy workout heuristic. */
  activities?: readonly ActivityRecord[];
  /** Returns the canonical sport key or `null` for "unknown — skip". */
  canonicalSport: CanonicalSport;
};

export type MatchExecutedWorkoutsAppend = {
  matchId: string;
  toAppend: string[];
};

const buildAppendsForMatch = (
  match: SessionMatch,
  refsByDate: ReadonlyMap<string, ExecutedRef[]>,
  matchCanonical: string
): string[] => {
  const refs = refsByDate.get(match.date) ?? [];
  const taken = new Set<string>([match.workoutId, ...match.executedWorkoutIds]);
  const toAppend: string[] = [];
  for (const ref of refs) {
    if (taken.has(ref.id)) continue;
    if (ref.canonical !== matchCanonical) continue;
    toAppend.push(ref.id);
    taken.add(ref.id);
  }
  return toAppend;
};

const resolveMatchCanonical = (
  match: SessionMatch,
  workouts: readonly WorkoutRecord[],
  canonicalSport: CanonicalSport
): string | null => {
  const structured = workouts.find((w) => w.id === match.workoutId);
  if (!structured) return null;
  return canonicalSport(structured.sport);
};

export const matchExecutedWorkouts = (
  input: MatchExecutedWorkoutsInput
): MatchExecutedWorkoutsAppend[] => {
  const refsByDate = indexExecutedRefsByDate(
    input.workouts,
    input.activities ?? [],
    input.canonicalSport
  );
  const out: MatchExecutedWorkoutsAppend[] = [];
  for (const match of input.sessionMatches) {
    const matchCanonical = resolveMatchCanonical(
      match,
      input.workouts,
      input.canonicalSport
    );
    if (!matchCanonical) continue;
    const toAppend = buildAppendsForMatch(match, refsByDate, matchCanonical);
    if (toAppend.length > 0) out.push({ matchId: match.id, toAppend });
  }
  return out;
};
