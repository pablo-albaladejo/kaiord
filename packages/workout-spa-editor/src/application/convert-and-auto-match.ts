/**
 * convertAndAutoMatch — composes the existing `convertCoachingActivity`
 * use case with `matchSession` so the dialog "Convert" flow auto-creates
 * the plan↔execution link in one application call.
 *
 * No-op semantics for the auto-link step (per spec):
 * - If the activity is ALREADY part of a match, skip silently.
 * - If the produced/existing workout is ALREADY matched (to any activity
 *   in this profile), skip silently.
 * - If a concurrent matcher wins between the pre-check and the put,
 *   `SessionAlreadyMatchedError` is swallowed; other errors propagate.
 *
 * The use case returns the same `{workoutId, created}` shape as the
 * underlying convert so existing callers can switch with minimal diff.
 */

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../ports/persistence-port";
import type { SessionMatchRepository } from "../ports/session-match-repository";
import type { SessionMatch } from "../types/session-match";
import { CoachingActivityNotFoundError } from "../types/session-match-errors";
import { SessionAlreadyMatchedError } from "../types/session-match-errors";
import { convertCoachingActivity } from "./coaching/convert-coaching-activity";

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

  // Auto-link only on first-ever convert. When `created === false` the
  // workout already existed (idempotent re-convert OR re-convert after a
  // manual unmatch), so re-asserting the match by side effect would
  // override either an existing link or the user's explicit unmatch
  // intent. The dialog's "Match to..." action stays available for either
  // case if the user wants to relink manually.
  if (!conversion.created) return conversion;

  const [activitySide, workoutSide] = await Promise.all([
    deps.sessionMatches.getByActivityId(activity.profileId, activity.id),
    deps.sessionMatches.getByWorkoutId(
      activity.profileId,
      conversion.workoutId
    ),
  ]);
  if (activitySide || workoutSide) return conversion;

  const match: SessionMatch = {
    id: deps.newMatchId(),
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: conversion.workoutId,
    date: activity.date,
    createdAt: deps.clock(),
    source: "auto-conversion",
  };

  try {
    await deps.sessionMatches.put(match);
  } catch (err) {
    // Concurrent matcher beat us between pre-check and write — preserve
    // the concurrent match, do not surface an error to the caller.
    if (err instanceof SessionAlreadyMatchedError) return conversion;
    throw err;
  }
  return conversion;
}
