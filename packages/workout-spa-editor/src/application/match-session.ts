/**
 * matchSession — links a planned coaching activity with the executed
 * workout. Every dependency (clock / id generator / repositories) is
 * injected so tests stay deterministic.
 *
 * The activity is the profile-anchored side: an activity belongs to one
 * profile, so cross-profile is enforced via the activity check. Workouts
 * are profile-agnostic and may be matched in multiple profiles
 * independently — uniqueness is per `(profileId, *)`.
 */

import type { CoachingRepository } from "../ports/persistence-port";
import type { WorkoutRepository } from "../ports/persistence-port";
import type { SessionMatchRepository } from "../ports/session-match-repository";
import type { SessionMatch, SessionMatchSource } from "../types/session-match";
import {
  CoachingActivityNotFoundError,
  CrossProfileMatchError,
  WorkoutNotFoundError,
} from "../types/session-match-errors";

export type MatchSessionInput = {
  profileId: string;
  coachingActivityId: string;
  workoutId: string;
  /** Defaults to "manual"; production call sites MUST pass explicitly. */
  source?: SessionMatchSource;
};

export type MatchSessionDeps = {
  clock: () => string;
  idGenerator: () => string;
  repository: SessionMatchRepository;
  coachingRepository: CoachingRepository;
  workoutRepository: WorkoutRepository;
};

export async function matchSession(
  input: MatchSessionInput,
  deps: MatchSessionDeps
): Promise<SessionMatch> {
  const activity = await deps.coachingRepository.getById(
    input.coachingActivityId
  );
  if (!activity) {
    throw new CoachingActivityNotFoundError(input.coachingActivityId);
  }
  if (activity.profileId !== input.profileId) {
    throw new CrossProfileMatchError(
      `activity ${activity.id} belongs to profile ${activity.profileId}, not ${input.profileId}`
    );
  }

  const workout = await deps.workoutRepository.getById(input.workoutId);
  if (!workout) {
    throw new WorkoutNotFoundError(input.workoutId);
  }

  const match: SessionMatch = {
    id: deps.idGenerator(),
    profileId: input.profileId,
    coachingActivityId: input.coachingActivityId,
    workoutId: input.workoutId,
    date: activity.date,
    createdAt: deps.clock(),
    source: input.source ?? "manual",
  };

  await deps.repository.put(match);
  return match;
}
