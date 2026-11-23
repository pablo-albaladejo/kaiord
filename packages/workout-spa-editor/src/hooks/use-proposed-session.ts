/**
 * useProposedSession — the session a `create_workout` tool call produced, plus
 * the one it landed beside.
 *
 * `doCreateWorkout` persists a fresh record and removes nothing, so the prior
 * value here is whatever session was ALREADY on that date when the proposal was
 * written — never something the proposal replaced. `selectPriorSummary` holds
 * both constraints that make that true.
 *
 * Reads through Dexie directly, like `use-workout-detail-record` — the
 * component layer may not, which is why this lives in `hooks/`.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { useActiveLocale } from "../i18n/LocaleProvider";
import { thresholdsForSport } from "../lib/athlete";
import type { ReviewCopy, ReviewModel } from "../lib/workout-review";
import { buildReviewModel, reviewCopyFor } from "../lib/workout-review";
import type { WorkoutRecord } from "../types/calendar-record";
import type { Profile } from "../types/profile";
import { selectPriorSummary } from "./select-prior-session";
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

const summarizeWith =
  (profile: Profile | null, fallbackTitle: string, copy: ReviewCopy) =>
  (record: WorkoutRecord): ReviewModel | null => {
    if (!record.krd) return null;
    return buildReviewModel(
      record.krd,
      thresholdsForSport(profile, record.sport),
      fallbackTitle,
      copy
    );
  };

const toSummary = (model: ReviewModel): ProposedSessionSummary => ({
  title: model.title,
  duration: model.duration,
  tss: model.tss,
});

export function useProposedSession(
  workoutId: string,
  fallbackTitle: string
): ProposedSession | null {
  const profile = useActiveProfileLive()?.profile ?? null;
  const locale = useActiveLocale();
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

  const summarize = summarizeWith(
    profile,
    fallbackTitle,
    reviewCopyFor(locale)
  );
  const model = summarize(day.proposed);
  if (!model) return null;

  return {
    ...toSummary(model),
    dist: model.dist,
    previous: selectPriorSummary(
      day.sameDay,
      day.proposed,
      summarize,
      toSummary
    ),
  };
}
