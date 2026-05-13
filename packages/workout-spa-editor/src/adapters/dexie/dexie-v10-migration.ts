/**
 * v9 → v10 migration — coaching auto-match retro-fix.
 *
 * One-time scan that walks every `coachingActivities` row, joins to the
 * `workouts` table by `(source, namespacedSourceId)`, and writes a fresh
 * `sessionMatches` row for every pair that is missing one. Source =
 * `"auto-coaching-v10-migration"` so analytics can distinguish retro-
 * matched rows from per-call auto-coaching matches (per design D8).
 *
 * Idempotent at the row level: existing matches are never overwritten,
 * existing rows from another `source` are skipped. A re-run produces
 * zero new writes.
 *
 * The total `created` count is exposed via `consumeLastV10Result` so the
 * bootstrap layer can fire the spec-mandated toast + analytics event
 * once Dexie's `open()` resolves. The state is module-scoped to mirror
 * Dexie's own singleton instance.
 */
import type { Transaction } from "dexie";

import { namespaceSourceId } from "../../types/coaching-activity-record";

export type V10MigrationResult = { created: number };

let lastResult: V10MigrationResult | null = null;

export const consumeLastV10Result = (): V10MigrationResult | null => {
  const result = lastResult;
  lastResult = null;
  return result;
};

type CoachingRow = {
  id: string;
  profileId: string;
  source: string;
  sourceId: string;
  date: string;
};

type WorkoutRow = { id: string; source: string; sourceId: string | null };

type MatchRow = { profileId: string; coachingActivityId: string };

const buildExistingMatchKeys = (matches: MatchRow[]): Set<string> =>
  new Set(matches.map((m) => `${m.profileId}::${m.coachingActivityId}`));

const buildWorkoutLookup = (workouts: WorkoutRow[]): Map<string, string> => {
  const lookup = new Map<string, string>();
  for (const w of workouts) {
    if (w.sourceId === null) continue;
    lookup.set(`${w.source}::${w.sourceId}`, w.id);
  }
  return lookup;
};

const buildPendingMatch = (
  activity: CoachingRow,
  workoutId: string,
  newId: () => string,
  now: () => string
) => ({
  id: newId(),
  profileId: activity.profileId,
  coachingActivityId: activity.id,
  workoutId,
  date: activity.date,
  createdAt: now(),
  source: "auto-coaching-v10-migration" as const,
  executedWorkoutIds: [] as string[],
});

export type V10MigrationDeps = {
  newId?: () => string;
  now?: () => string;
};

export const applyV10Upgrade = async (
  tx: Transaction,
  deps: V10MigrationDeps = {}
): Promise<void> => {
  const newId = deps.newId ?? (() => crypto.randomUUID());
  const now = deps.now ?? (() => new Date().toISOString());
  const activities = (await tx
    .table("coachingActivities")
    .toArray()) as CoachingRow[];
  if (activities.length === 0) {
    lastResult = { created: 0 };
    return;
  }
  const workouts = (await tx.table("workouts").toArray()) as WorkoutRow[];
  const matches = (await tx.table("sessionMatches").toArray()) as MatchRow[];
  const workoutByKey = buildWorkoutLookup(workouts);
  const matchedKeys = buildExistingMatchKeys(matches);

  const pending: ReturnType<typeof buildPendingMatch>[] = [];
  for (const activity of activities) {
    const key = `${activity.profileId}::${activity.id}`;
    if (matchedKeys.has(key)) continue;
    const ns = namespaceSourceId(activity.profileId, activity.sourceId);
    const workoutId = workoutByKey.get(`${activity.source}::${ns}`);
    if (!workoutId) continue;
    pending.push(buildPendingMatch(activity, workoutId, newId, now));
  }
  if (pending.length > 0) {
    await tx.table("sessionMatches").bulkAdd(pending);
  }
  lastResult = { created: pending.length };
};
