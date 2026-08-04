/**
 * useProposedSession — the session a `create_workout` tool call produced, plus
 * the one it landed beside.
 *
 * `doCreateWorkout` persists a fresh record and removes nothing, so the
 * "before" here is whatever session was ALREADY on that date: the earliest
 * other record of the same profile and day that carries a KRD. When the date
 * held nothing else, `previous` is null and callers render no comparison.
 *
 * Reads through Dexie directly, like `use-workout-detail-record` — the
 * component layer may not, which is why this lives in `hooks/`.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { thresholdsForSport } from "../lib/athlete";
import { buildReviewModel } from "../lib/workout-review";
import type { WorkoutRecord } from "../types/calendar-record";
import type { Profile } from "../types/profile";
import { useActiveProfileLive } from "./use-active-profile-live";

export type ProposedSessionSummary = {
  title: string;
  duration: string;
  tss: number;
};

export type ProposedSession = ProposedSessionSummary & {
  dist: number[];
  previous: ProposedSessionSummary | null;
};

const summarize = (
  record: WorkoutRecord,
  profile: Profile | null,
  fallbackTitle: string
) => {
  if (!record.krd) return null;
  const thresholds = thresholdsForSport(profile, record.sport);
  return buildReviewModel(record.krd, thresholds, fallbackTitle);
};

const earliestOther = (
  records: WorkoutRecord[],
  proposedId: string
): WorkoutRecord | undefined =>
  records
    .filter((record) => record.id !== proposedId && record.krd !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

export function useProposedSession(
  workoutId: string,
  fallbackTitle: string
): ProposedSession | null {
  const profile = useActiveProfileLive()?.profile ?? null;
  const day = useLiveQuery(async () => {
    const table = db.table<WorkoutRecord>("workouts");
    const proposed = await table.get(workoutId);
    if (!proposed) return null;
    const sameDay = await table
      .where("[profileId+date]")
      .equals([proposed.profileId, proposed.date])
      .toArray();
    return { proposed, sameDay };
  }, [workoutId]);

  if (!day) return null;

  const model = summarize(day.proposed, profile, fallbackTitle);
  if (!model) return null;

  const prior = earliestOther(day.sameDay, day.proposed.id);
  const priorModel = prior ? summarize(prior, profile, fallbackTitle) : null;

  return {
    title: model.title,
    duration: model.duration,
    tss: model.tss,
    dist: model.dist,
    previous: priorModel && {
      title: priorModel.title,
      duration: priorModel.duration,
      tss: priorModel.tss,
    },
  };
}
