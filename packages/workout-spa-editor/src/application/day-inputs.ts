/**
 * Builds the target day's same-sport inputs from its raw rows (design §3.8).
 * `held` is every workout id a match of the profile plans or holds, in any
 * week, and `matchedPlans` every coach plan with a match: neither shows as a
 * solo card on this day, so neither is counted solo. A recording is an
 * executed activity: its twin workout when it has one, else the activity.
 * Only an unheld solo recording is flagged, because only it can be linked.
 */
import type { ActivityRecord } from "../types/activity-record";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";
import type { DayInput } from "./same-sport-on-day";

export type DayRows = {
  day: string;
  matches: readonly SessionMatch[];
  plannedById: ReadonlyMap<string, WorkoutRecord>;
  workouts: readonly WorkoutRecord[];
  activities: readonly ActivityRecord[];
  plans: readonly CoachingActivityRecord[];
};

const matchedInputs = (rows: DayRows): DayInput[] =>
  rows.matches.flatMap((m) => {
    const planned = rows.plannedById.get(m.workoutId);
    if (m.date !== rows.day || !planned) return [];
    const workoutIds = [m.workoutId, ...(m.executedWorkoutIds ?? [])];
    // Its recording is held, so the move never links it: no lock sentence.
    return [{ workoutIds, sport: planned.sport, recording: false }];
  });

const soloInputs = (rows: DayRows, held: ReadonlySet<string>): DayInput[] => {
  const twins = new Set(rows.activities.map((a) => a.linkedWorkoutId));
  const workoutIds = new Set(rows.workouts.map((w) => w.id));
  const workouts = rows.workouts
    .filter((w) => !held.has(w.id))
    .map((w) => ({
      workoutIds: [w.id],
      sport: w.sport,
      recording: twins.has(w.id),
    }));
  const recordings = rows.activities
    .filter((a) => !a.linkedWorkoutId || !workoutIds.has(a.linkedWorkoutId))
    .map((a) => ({ id: a.linkedWorkoutId ?? a.id, sport: a.sport }))
    .filter((r) => !held.has(r.id))
    .map((r) => ({ workoutIds: [r.id], sport: r.sport, recording: true }));
  return [...workouts, ...recordings];
};

const planInputs = (rows: DayRows): DayInput[] => {
  const matched = new Set(rows.matches.map((m) => m.coachingActivityId));
  return rows.plans
    .filter((p) => !matched.has(p.id))
    .map((p) => ({ workoutIds: [], sport: p.sport, recording: false }));
};

export const buildDayInputs = (
  rows: DayRows,
  movedWorkoutId: string
): DayInput[] => {
  const held = new Set(
    rows.matches.flatMap((m) => [m.workoutId, ...(m.executedWorkoutIds ?? [])])
  );
  return [
    ...matchedInputs(rows),
    ...soloInputs(rows, held),
    ...planInputs(rows),
  ].filter((i) => !i.workoutIds.includes(movedWorkoutId));
};
