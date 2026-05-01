/**
 * Internal helpers for the auto-match heuristic — kept separate so the
 * top-level use case stays under the file-line cap.
 */

import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import { canonicalSportFamily } from "./canonical-sport-family";
import { computeComplianceScore } from "./compute-compliance-score";
import type { MatchSuggestion } from "./match-suggestion";
import { parseCoachingDuration } from "./parse-coaching-duration";

export type Candidate = {
  activity: CoachingActivityRecord;
  workout: WorkoutRecord;
  family: string;
  score: number | null;
  deltaSeconds: number | undefined;
};

export const SCORE_THRESHOLD = 0.6;

export const enumerateCandidates = (
  activities: CoachingActivityRecord[],
  workouts: WorkoutRecord[]
): Candidate[] => {
  const cs: Candidate[] = [];
  for (const activity of activities) {
    const family = canonicalSportFamily(activity.sport);
    for (const workout of workouts) {
      if (workout.date !== activity.date) continue;
      if (canonicalSportFamily(workout.sport) !== family) continue;
      const planDur = parseCoachingDuration(activity.duration);
      const actualDur = workout.raw?.duration?.value;
      const score = computeComplianceScore(planDur, actualDur);
      const deltaSeconds =
        planDur !== undefined && actualDur !== undefined
          ? Math.abs(planDur - actualDur)
          : undefined;
      cs.push({ activity, workout, family, score, deltaSeconds });
    }
  }
  return cs;
};

export const passesFilter = (c: Candidate): boolean =>
  c.score === null || c.score >= SCORE_THRESHOLD;

export const compareCandidates = (a: Candidate, b: Candidate): number => {
  // Parsed-score candidates outrank null-score; among parsed, higher score first.
  const ra = a.score === null ? Number.POSITIVE_INFINITY : -a.score;
  const rb = b.score === null ? Number.POSITIVE_INFINITY : -b.score;
  if (ra !== rb) return ra - rb;
  if (a.activity.id !== b.activity.id)
    return a.activity.id < b.activity.id ? -1 : 1;
  return a.workout.id < b.workout.id ? -1 : 1;
};

export const buildSuggestion = (c: Candidate): MatchSuggestion => ({
  activityId: c.activity.id,
  workoutId: c.workout.id,
  score: c.score,
  reasons:
    c.deltaSeconds !== undefined
      ? [
          { code: "sport-family-match", family: c.family },
          { code: "duration-match", deltaSeconds: c.deltaSeconds },
        ]
      : [
          { code: "sport-family-match", family: c.family },
          { code: "duration-unknown" },
        ],
});

export const greedyAccept = (candidates: Candidate[]): MatchSuggestion[] => {
  const acceptedActivities = new Set<string>();
  const acceptedWorkouts = new Set<string>();
  const accepted: MatchSuggestion[] = [];
  for (const c of candidates) {
    if (acceptedActivities.has(c.activity.id)) continue;
    if (acceptedWorkouts.has(c.workout.id)) continue;
    accepted.push(buildSuggestion(c));
    acceptedActivities.add(c.activity.id);
    acceptedWorkouts.add(c.workout.id);
  }
  return accepted;
};
