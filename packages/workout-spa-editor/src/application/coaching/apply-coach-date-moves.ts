/**
 * Follow the coach (design §3.11): after a week sync upserts its
 * activities, each workout converted from one of them follows the coach's
 * date. The baseline is the workout's `coachDate`, else the activity's
 * pre-upsert date; with neither, the fetched date becomes the baseline.
 * Each write re-reads the workout in a transaction, bumps `updatedAt` and leaves
 * `modifiedAt` and `state` alone, and re-dates the workout's unlocked match in
 * the same transaction. A never-converted activity writes nothing.
 */
import type {
  PersistencePort,
  WorkoutRepository,
} from "../../ports/persistence-port";
import {
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../../types/coaching-activity-record";
import { coachDateVerdict } from "./coach-date-verdict";
import {
  type FollowedMatchRepository,
  redateFollowedMatch,
} from "./redate-followed-match";

export type OverriddenSession = {
  workoutId: string;
  athleteDate: string;
  coachDate: string;
};

export type CoachDateMoves = {
  coachMoves: number;
  overriddenLocalMoves: number;
  /** The athlete days a coach move replaced, one per `overriddenLocalMoves`. */
  overridden: OverriddenSession[];
};

export type CoachDateMoveDeps = {
  workouts: WorkoutRepository;
  sessionMatch: FollowedMatchRepository;
  now: () => string;
  /** Read and write in one transaction, so no other writer's fields are lost. */
  transaction: PersistencePort["transaction"];
};

const moveOne = (
  deps: CoachDateMoveDeps,
  activity: CoachingActivityRecord,
  preUpsertDate: string | undefined
) =>
  deps.transaction(async () => {
    const sourceId = namespaceSourceId(activity.profileId, activity.sourceId);
    const workout = await deps.workouts.getBySourceId(
      activity.source,
      sourceId
    );
    if (!workout) return undefined;
    const verdict = coachDateVerdict(workout, preUpsertDate, activity.date);
    if (!verdict.write) return undefined;
    const updatedAt = deps.now();
    await deps.workouts.put({ ...workout, ...verdict.write, updatedAt });
    if (verdict.write.date !== workout.date)
      await redateFollowedMatch(
        deps.sessionMatch,
        workout,
        activity,
        updatedAt
      );
    return { count: verdict.count, workoutId: workout.id, from: workout.date };
  });

export const applyCoachDateMoves = async (
  deps: CoachDateMoveDeps,
  fetched: readonly CoachingActivityRecord[],
  preUpsert: readonly CoachingActivityRecord[]
): Promise<CoachDateMoves> => {
  const counts: CoachDateMoves = {
    coachMoves: 0,
    overriddenLocalMoves: 0,
    overridden: [],
  };
  const before = new Map(preUpsert.map((r) => [r.id, r.date]));
  for (const activity of fetched) {
    const moved = await moveOne(deps, activity, before.get(activity.id));
    if (!moved?.count) continue;
    counts[moved.count]++;
    if (moved.count === "overriddenLocalMoves")
      counts.overridden.push({
        workoutId: moved.workoutId,
        athleteDate: moved.from,
        coachDate: activity.date,
      });
  }
  return counts;
};
