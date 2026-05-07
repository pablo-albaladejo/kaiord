/**
 * convertAndAutoMatch — composes the legacy `convertCoachingActivity`
 * use case with the auto-match invariant so the dialog "Convert" flow
 * always produces a single matched calendar card per training session.
 *
 * Auto-heal semantics (per spa-coaching-integration "Convert coaching
 * activity to workout" spec, MODIFIED requirement):
 * - First-time conversion: writes the workout AND a session_match.
 * - Idempotent re-call where the workout already exists but no match
 *   does (legacy data, or this code path running for the first time
 *   on a previously converted activity): writes the missing match.
 *   This is the same auto-heal applied by the Dexie v10 migration in
 *   bulk; running it per-call closes the window between v10 boot and
 *   the dialog open.
 * - Re-call where activity OR workout side already has a match: skip.
 *   `SessionAlreadyMatchedError` from a concurrent winner is treated
 *   as a benign no-op.
 *
 * The use case returns the same `{workoutId, created}` shape as the
 * underlying convert so existing callers can switch with minimal diff.
 */

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../ports/persistence-port";
import type { SessionMatchRepository } from "../ports/session-match-repository";
import { CoachingActivityNotFoundError } from "../types/session-match-errors";
import { convertCoachingActivity } from "./coaching/convert-coaching-activity";
import { ensureSessionMatch } from "./coaching/ensure-session-match";

export type ConvertAndAutoMatchInput = {
  activityId: string;
};

export type ConvertAndAutoMatchDeps = {
  coaching: CoachingRepository;
  workouts: WorkoutRepository;
  sessionMatches: SessionMatchRepository;
  newWorkoutId: () => string;
  newMatchId: () => string;
  clock: () => string;
};

export async function convertAndAutoMatch(
  input: ConvertAndAutoMatchInput,
  deps: ConvertAndAutoMatchDeps
): Promise<{ workoutId: string; created: boolean }> {
  const activity = await deps.coaching.getById(input.activityId);
  if (!activity) throw new CoachingActivityNotFoundError(input.activityId);

  const conversion = await convertCoachingActivity(
    {
      coaching: deps.coaching,
      workouts: deps.workouts,
      newId: deps.newWorkoutId,
      now: deps.clock,
    },
    input.activityId
  );

  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: conversion.workoutId,
    date: activity.date,
    source: "auto-conversion",
    newId: deps.newMatchId,
    clock: deps.clock,
  });
  return conversion;
}
