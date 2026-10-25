/**
 * Type surface for `convertCoachingActivityManual`. Lives in its own
 * module so the use-case file stays under the per-file line cap.
 */
import type { Analytics } from "@kaiord/core";

import type {
  CoachingRepository,
  PersistencePort,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { SessionMatchRepository } from "../../ports/session-match-repository";

export type CoachingActivityForConvert = NonNullable<
  Awaited<ReturnType<CoachingRepository["getById"]>>
>;

export type ConvertManualInput = { activityId: string };

export type ConvertManualDeps = {
  coaching: CoachingRepository;
  workouts: WorkoutRepository;
  sessionMatches: SessionMatchRepository;
  transaction: PersistencePort["transaction"];
  analytics: Analytics;
  newWorkoutId: () => string;
  newMatchId: () => string;
  clock: () => string;
};

export type ConvertManualResult = { workoutId: string; created: boolean };
