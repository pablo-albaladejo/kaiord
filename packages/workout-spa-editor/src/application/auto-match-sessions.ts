/**
 * autoMatchSessions — enumerates candidate plan↔execution pairs for the
 * current profile/week and returns confirmable suggestions WITHOUT
 * writing any SessionMatch row. The user accepts/rejects each row in
 * the banner.
 *
 * Heuristic: same day + same canonical sport family + duration variance
 * within ±20% (score ≥ 0.6). Duration-unknown candidates bypass the
 * threshold but score `null` so the visual encoding stays neutral.
 *
 * Tiebreaker: highest score first; on tie, lower `activityId` first;
 * on further tie, lower `workoutId` first. Greedy assignment ensures
 * each activity and each workout appear in at most one suggestion.
 */

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../ports/persistence-port";
import type { SessionMatchRepository } from "../ports/session-match-repository";
import {
  compareCandidates,
  enumerateCandidates,
  greedyAccept,
  passesFilter,
} from "./auto-match-candidate";
import type { MatchSuggestion } from "./match-suggestion";

export type AutoMatchSessionsInput = {
  profileId: string;
  weekStart: string;
};

export type AutoMatchSessionsDeps = {
  coachingRepository: CoachingRepository;
  workoutRepository: WorkoutRepository;
  repository: SessionMatchRepository;
};

const addDays = (yyyymmdd: string, days: number): string => {
  const d = new Date(yyyymmdd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export async function autoMatchSessions(
  input: AutoMatchSessionsInput,
  deps: AutoMatchSessionsDeps
): Promise<MatchSuggestion[]> {
  const weekEnd = addDays(input.weekStart, 6);
  const [activities, workouts, existingMatches] = await Promise.all([
    deps.coachingRepository.getByProfileAndDateRange(
      input.profileId,
      input.weekStart,
      weekEnd
    ),
    deps.workoutRepository.getByDateRange(input.weekStart, weekEnd),
    deps.repository.listByProfileAndWeek(
      input.profileId,
      input.weekStart,
      weekEnd
    ),
  ]);

  const matchedActivityIds = new Set(
    existingMatches.map((m) => m.coachingActivityId)
  );
  const matchedWorkoutIds = new Set(existingMatches.map((m) => m.workoutId));
  const eligibleActivities = activities.filter(
    (a) => !matchedActivityIds.has(a.id)
  );
  const eligibleWorkouts = workouts.filter((w) => !matchedWorkoutIds.has(w.id));

  const candidates = enumerateCandidates(eligibleActivities, eligibleWorkouts)
    .filter(passesFilter)
    .sort(compareCandidates);
  return greedyAccept(candidates);
}
