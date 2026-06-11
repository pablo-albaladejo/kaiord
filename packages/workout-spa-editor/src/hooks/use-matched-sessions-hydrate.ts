/**
 * Hydrate join for `useMatchedSessions`: maps each `SessionMatch` to
 * the view-model the calendar bucketer consumes, and surfaces the
 * dropped-pair list for the one-shot heal.
 *
 * Dropped matches are no longer silent — a `console.warn` reports each
 * one with structured fields so production telemetry can spot a
 * recurring drop without grepping for missing rows. See
 * `.omc/autopilot/bug-trace.md` §H8 for the original symptom.
 */

import { db } from "../adapters/dexie/dexie-database";
import { toCoachingActivity } from "../adapters/train2go/coaching-record-to-activity.converter";
import { computeComplianceScore } from "../application/compute-compliance-score";
import { parseCoachingDuration } from "../application/parse-coaching-duration";
import type { MatchedSession } from "../components/molecules/MatchedSessionCard/MatchedSessionCard";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";
import { logger } from "../utils/logger";
import type { DanglingMatch } from "./use-matched-sessions-heal";
import {
  collectWorkoutIds,
  resolveExecuted,
} from "./use-matched-sessions-hydrate-helpers";

export type MatchedSessionWithMetadata = MatchedSession & {
  match: SessionMatch;
};

const DROP_WARN = "[matched-sessions] dropping match — dangling ref";

const fetchById = async (
  matches: SessionMatch[]
): Promise<{
  aById: Map<string, CoachingActivityRecord>;
  wById: Map<string, WorkoutRecord>;
}> => {
  const [activities, workouts] = await Promise.all([
    db
      .table<CoachingActivityRecord>("coachingActivities")
      .where("id")
      .anyOf(matches.map((m) => m.coachingActivityId))
      .toArray(),
    db
      .table<WorkoutRecord>("workouts")
      .where("id")
      .anyOf(collectWorkoutIds(matches))
      .toArray(),
  ]);
  return {
    aById: new Map(activities.map((a) => [a.id, a])),
    wById: new Map(workouts.map((w) => [w.id, w])),
  };
};

export const hydrateMatchedSessions = async (
  matches: SessionMatch[]
): Promise<{
  matched: MatchedSessionWithMetadata[];
  dangling: DanglingMatch[];
}> => {
  const { aById, wById } = await fetchById(matches);
  const matched: MatchedSessionWithMetadata[] = [];
  const dangling: DanglingMatch[] = [];
  for (const match of matches) {
    const record = aById.get(match.coachingActivityId);
    const workout = wById.get(match.workoutId);
    if (!record || !workout) {
      logger.warn(DROP_WARN, {
        matchId: match.id,
        coachingActivityId: match.coachingActivityId,
        workoutId: match.workoutId,
        hadActivity: Boolean(record),
        hadWorkout: Boolean(workout),
      });
      dangling.push({ match, hadWorkout: Boolean(workout) });
      continue;
    }
    const executed = resolveExecuted(match, wById);
    matched.push({
      match,
      activity: toCoachingActivity(record),
      workout,
      complianceScore: computeComplianceScore(
        parseCoachingDuration(record.duration),
        workout.raw?.duration?.value
      ),
      executed,
    });
  }
  return { matched, dangling };
};
