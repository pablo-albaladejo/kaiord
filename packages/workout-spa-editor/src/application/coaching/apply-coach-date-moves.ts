/**
 * Follow the coach (design §3.11): after a week sync upserts its
 * activities, each workout converted from one of them follows the coach's
 * date. The baseline is the workout's `coachDate`, else the activity's
 * pre-upsert date; with neither, the fetched date becomes the baseline.
 * Each write re-reads the workout, bumps `updatedAt` and leaves
 * `modifiedAt` and `state` alone. A never-converted activity writes nothing.
 */
import type { WorkoutRepository } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../../types/coaching-activity-record";

export type CoachDateMoves = {
  coachMoves: number;
  overriddenLocalMoves: number;
};

type Verdict = {
  write?: Pick<WorkoutRecord, "date" | "coachDate">;
  count?: keyof CoachDateMoves;
};

/** The decision table for one fetched date. */
export const coachDateVerdict = (
  workout: Pick<WorkoutRecord, "date" | "coachDate">,
  preUpsertDate: string | undefined,
  fetched: string
): Verdict => {
  const baseline = workout.coachDate ?? preUpsertDate;
  const date = workout.date;
  if (baseline === undefined || baseline === fetched)
    return workout.coachDate === undefined
      ? { write: { date, coachDate: fetched } }
      : {};
  const moved = { write: { date: fetched, coachDate: fetched } };
  if (date === baseline) return { ...moved, count: "coachMoves" };
  if (date === fetched) return moved;
  return { ...moved, count: "overriddenLocalMoves" };
};

export const applyCoachDateMoves = async (
  deps: { workouts: WorkoutRepository; now: () => string },
  fetched: readonly CoachingActivityRecord[],
  preUpsert: readonly CoachingActivityRecord[]
): Promise<CoachDateMoves> => {
  const counts: CoachDateMoves = { coachMoves: 0, overriddenLocalMoves: 0 };
  const before = new Map(preUpsert.map((r) => [r.id, r.date]));
  for (const activity of fetched) {
    const sourceId = namespaceSourceId(activity.profileId, activity.sourceId);
    const workout = await deps.workouts.getBySourceId(
      activity.source,
      sourceId
    );
    if (!workout) continue;
    const verdict = coachDateVerdict(
      workout,
      before.get(activity.id),
      activity.date
    );
    if (!verdict.write) continue;
    await deps.workouts.put({
      ...workout,
      ...verdict.write,
      updatedAt: deps.now(),
    });
    if (verdict.count) counts[verdict.count]++;
  }
  return counts;
};
