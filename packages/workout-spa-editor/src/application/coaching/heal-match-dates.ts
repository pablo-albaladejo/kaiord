/**
 * healMatchDates (design §3.5): moves every stale match of a coach-built
 * workout onto the workout's effective date. The batched read only picks
 * candidates; each re-date re-reads the match and the workout in its own
 * transaction, so a move or a link that lands meanwhile is never overwritten.
 * A locked match (§3.1) and a workout that is not coach-built are left alone.
 * Returns the number of matches healed.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatch } from "../../types/session-match";

export type HealMatchDatesDeps = Pick<
  PersistencePort,
  "workouts" | "sessionMatch" | "coaching" | "transaction"
> & { now: () => string };

const isStale = (workout: WorkoutRecord | undefined, match: SessionMatch) =>
  workout !== undefined &&
  workout.coachDate !== undefined &&
  workout.date !== match.date &&
  match.executedWorkoutIds.length === 0;

const healOne = (deps: HealMatchDatesDeps, matchId: string) =>
  deps.transaction(async () => {
    const match = await deps.sessionMatch.getById(matchId);
    if (!match) return false;
    const workout = await deps.workouts.getById(match.workoutId);
    if (!workout || !isStale(workout, match)) return false;
    const activity = await deps.coaching.getById(match.coachingActivityId);
    if (activity?.status === "completed") return false;
    await deps.sessionMatch.updateDate(match.id, workout.date, deps.now());
    return true;
  });

export const healMatchDates = async (
  deps: HealMatchDatesDeps,
  { profileId }: { profileId: string }
): Promise<number> => {
  const matches = await deps.sessionMatch.listByProfile(profileId);
  const workouts = await Promise.all(
    matches.map((m) => deps.workouts.getById(m.workoutId))
  );
  const candidates = matches.filter((m, i) => isStale(workouts[i], m));
  let healed = 0;
  for (const candidate of candidates)
    if (await healOne(deps, candidate.id)) healed++;
  return healed;
};

/** After an import, which may touch any profile: heal them all. */
export const healAllMatchDates = async (
  deps: HealMatchDatesDeps & Pick<PersistencePort, "profiles">
): Promise<number> => {
  let healed = 0;
  for (const profile of await deps.profiles.getAll())
    healed += await healMatchDates(deps, { profileId: profile.id });
  return healed;
};
