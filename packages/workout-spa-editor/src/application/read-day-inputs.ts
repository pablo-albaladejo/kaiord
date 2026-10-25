/**
 * Reads one day's same-sport inputs for a move target outside the visible
 * week (design §3.8, AC-16): the `[profileId+date]` index on workouts,
 * activities and coach plans, plus the profile's matches. The matches are a
 * profile scan (`listByProfile`, measured under 4 ms for 1000 rows in B5)
 * rather than a date read, because a match dated in another week still holds
 * its recording and its plan, and neither may count as solo here.
 */
import type { PersistencePort } from "../ports/persistence-port";
import type { WorkoutRecord } from "../types/calendar-record";
import { buildDayInputs } from "./day-inputs";
import type { DayInput } from "./same-sport-on-day";

export type ReadDayInputsDeps = Pick<
  PersistencePort,
  "workouts" | "sessionMatch" | "coaching" | "activities"
>;

export type ReadDayInputsInput = {
  profileId: string;
  day: string;
  movedWorkoutId: string;
};

const plannedOf = async (
  deps: ReadDayInputsDeps,
  ids: readonly string[],
  sameDay: readonly WorkoutRecord[]
): Promise<Map<string, WorkoutRecord>> => {
  const byId = new Map(sameDay.map((w) => [w.id, w]));
  const missing = ids.filter((id) => !byId.has(id));
  const fetched = await Promise.all(
    missing.map((id) => deps.workouts.getById(id))
  );
  for (const w of fetched) if (w) byId.set(w.id, w);
  return byId;
};

export const readDayInputs = async (
  deps: ReadDayInputsDeps,
  { profileId, day, movedWorkoutId }: ReadDayInputsInput
): Promise<DayInput[]> => {
  const [matches, workouts, activities, plans] = await Promise.all([
    deps.sessionMatch.listByProfile(profileId),
    deps.workouts.getByProfileAndDateRange(profileId, day, day),
    deps.activities.getByProfileAndDateRange(profileId, day, day),
    deps.coaching.getByProfileAndDateRange(profileId, day, day),
  ]);
  const dayMatchWorkouts = matches
    .filter((m) => m.date === day)
    .map((m) => m.workoutId);
  const plannedById = await plannedOf(deps, dayMatchWorkouts, workouts);
  return buildDayInputs(
    { day, matches, plannedById, workouts, activities, plans },
    movedWorkoutId
  );
};
