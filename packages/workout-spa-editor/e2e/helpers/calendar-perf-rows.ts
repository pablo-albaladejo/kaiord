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
  /**
   * Plans on `day` whose match (and workout) sit on `onDay`, another week:
   * the week of `day` reads them and hides them, so they add read work and
   * no card.
   */
  crossWeek?: { count: number; onDay: string };
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
 * `soloPlans` plans and `soloActuals` workouts, all on one day, plus the
 * optional `crossWeek` plans matched in another week. Every row
 * carries the profile id: the calendar reads the active profile's rows only,
 * so an unowned workout is never rendered.
 */
export const buildPerfWeekRows = (s: PerfRowsInput) => {
  const plans: unknown[] = [];
  const workouts: unknown[] = [];
  const matches: unknown[] = [];
  for (const { prefix, day, crossWeek, ...n } of s.weeks) {
    // A plan on `day` and its workout on `onDay`, joined by match `matchId`.
    const pair = (kind: string, i: number, onDay: string, matchId: string) => {
      const plan = planRow(`${prefix}-act-${kind}-${i}`, day, s);
      const workout = workoutRow(`${prefix}-w-${kind}-${i}`, onDay, s);
      plans.push(kind === "matched" ? { ...plan, status: "completed" } : plan);
      workouts.push(workout);
      matches.push({
        id: matchId,
        profileId: s.profileId,
        coachingActivityId: plan.id,
        workoutId: workout.id,
        date: onDay,
        createdAt: s.now,
        source: "manual",
        executedWorkoutIds: [],
      });
    };
    for (let i = 0; i < n.matched; i += 1)
      pair("matched", i, day, `${prefix}-match-${i}`);
    for (let i = 0; i < (crossWeek?.count ?? 0); i += 1)
      pair("cross", i, crossWeek?.onDay ?? day, `${prefix}-cross-match-${i}`);
    for (let i = 0; i < n.soloPlans; i += 1)
      plans.push(planRow(`${prefix}-act-solo-${i}`, day, s));
    for (let i = 0; i < n.soloActuals; i += 1)
      workouts.push(workoutRow(`${prefix}-w-solo-${i}`, day, s));
  }
  return { plans, workouts, matches };
};
