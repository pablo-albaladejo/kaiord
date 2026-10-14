/** The cards one day of the calendar renders, by kind. */
export type CardCounts = {
  matched: number;
  soloPlans: number;
  soloActuals: number;
};

export type PerfWeekSeed = CardCounts & {
  /** Id prefix, so two seeded weeks never share a row id. */
  prefix: string;
  day: string;
};

export type PerfRowsInput = {
  profileId: string;
  now: string;
  weeks: PerfWeekSeed[];
};

const workoutRow = (id: string, date: string, s: PerfRowsInput) => ({
  id,
  profileId: s.profileId,
  date,
  state: "raw",
  sport: "cycling",
  source: "manual",
  sourceId: id,
  planId: null,
  raw: { description: "x", duration: { value: 3600, unit: "s" } },
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: s.now,
  modifiedAt: null,
  updatedAt: s.now,
});

// The persisted activity id is `<profileId>:<source>:<sourceId>`, and a
// session match points at it.
const planRow = (sourceId: string, date: string, s: PerfRowsInput) => ({
  id: `${s.profileId}:train2go:${sourceId}`,
  profileId: s.profileId,
  source: "train2go",
  sourceId,
  date,
  sport: "cycling",
  title: sourceId,
  status: "pending",
  fetchedAt: s.now,
});

/**
 * Per week, `matched` plan/workout pairs joined by a session match plus
 * `soloPlans` plans and `soloActuals` workouts, all on one day. Every row
 * carries the profile id: the calendar reads the active profile's rows only,
 * so an unowned workout is never rendered.
 */
export const buildPerfWeekRows = (s: PerfRowsInput) => {
  const plans: unknown[] = [];
  const workouts: unknown[] = [];
  const matches: unknown[] = [];
  for (const { prefix, day, ...n } of s.weeks) {
    for (let i = 0; i < n.matched; i += 1) {
      const plan = planRow(`${prefix}-act-matched-${i}`, day, s);
      const workout = workoutRow(`${prefix}-w-matched-${i}`, day, s);
      plans.push({ ...plan, status: "completed" });
      workouts.push(workout);
      matches.push({
        id: `${prefix}-match-${i}`,
        profileId: s.profileId,
        coachingActivityId: plan.id,
        workoutId: workout.id,
        date: day,
        createdAt: s.now,
        source: "manual",
        executedWorkoutIds: [],
      });
    }
    for (let i = 0; i < n.soloPlans; i += 1)
      plans.push(planRow(`${prefix}-act-solo-${i}`, day, s));
    for (let i = 0; i < n.soloActuals; i += 1)
      workouts.push(workoutRow(`${prefix}-w-solo-${i}`, day, s));
  }
  return { plans, workouts, matches };
};
