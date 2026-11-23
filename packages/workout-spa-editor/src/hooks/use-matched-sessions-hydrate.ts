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

import { toCoachingActivity } from "../adapters/train2go/coaching-record-to-activity.converter";
import { computeComplianceScore } from "../application/compute-compliance-score";
import { parseCoachingDuration } from "../application/parse-coaching-duration";
import type { MatchedSession } from "../components/molecules/MatchedSessionCard/MatchedSessionCard";
import type { MatchedSessionsReadModel } from "../ports/matched-sessions-read-model";
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

export const hydrateMatchedSessions = async (
  matches: SessionMatch[],
  readModel: MatchedSessionsReadModel
): Promise<{
  matched: MatchedSessionWithMetadata[];
  dangling: DanglingMatch[];
}> => {
  const { activitiesById: aById, workoutsById: wById } =
    await readModel.loadJoinSources(
      matches.map((m) => m.coachingActivityId),
      collectWorkoutIds(matches)
    );
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
