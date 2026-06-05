/**
 * Pure helpers for `useMatchedSessions` hydrate join. Extracted so the
 * entry file stays under the per-file line cap.
 */

import type { WorkoutRecord } from "../types/calendar-record";
import type { SessionMatch } from "../types/session-match";

/**
 * Flattens every workout id referenced by the matches into a single
 * deduped list — both the structured slot (`workoutId`) and every
 * executed slot (`executedWorkoutIds[*]`). The hydrate fetch needs all
 * of them in one `bulkGet`-equivalent call to stay within the read
 * budget.
 */
export const collectWorkoutIds = (matches: SessionMatch[]): string[] => {
  const out = new Set<string>();
  for (const m of matches) {
    out.add(m.workoutId);
    // Dexie returns raw rows (not Zod-parsed), so a row written before the
    // v12 `executedWorkoutIds` backfill — or seeded raw — may lack the field.
    for (const wid of m.executedWorkoutIds ?? []) out.add(wid);
  }
  return [...out];
};

/**
 * Resolves the executed slot for a match by looking each id up in the
 * pre-fetched workout map. Missing ids are silently dropped — they
 * are tolerated as dangling and surfaced by the existing drop warning
 * path if the structured slot is also missing.
 */
export const resolveExecuted = (
  match: SessionMatch,
  wById: ReadonlyMap<string, WorkoutRecord>
): WorkoutRecord[] =>
  (match.executedWorkoutIds ?? [])
    .map((wid) => wById.get(wid))
    .filter((w): w is WorkoutRecord => w !== undefined);
