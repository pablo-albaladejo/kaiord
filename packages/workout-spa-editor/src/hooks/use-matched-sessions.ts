/**
 * Reactive read of plan↔execution matches for the current profile and
 * visible week.
 *
 * Read budget per render is bounded: one `useLiveQuery` over
 * `session_matches` filtered by `(profileId, day in days)`, then one
 * `bulkGet` on `coachingActivities` and one on `workouts` to hydrate
 * the matched sides. The hook does not subscribe to those child
 * tables itself — the parent calendar page already does, and a
 * separate subscription would defeat the budget.
 *
 * Returns the same `MatchedSession` shape `MatchedSessionCard`
 * consumes (view-model `CoachingActivity`, not the persistence
 * record) — the record→view-model mapping is platform-aware via
 * the existing train2go mapper.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { toCoachingActivity } from "../adapters/train2go/coaching-record-to-activity.mapper";
import { computeComplianceScore } from "../application/compute-compliance-score";
import { parseCoachingDuration } from "../application/parse-coaching-duration";
import type { MatchedSession } from "../components/molecules/MatchedSessionCard/MatchedSessionCard";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";

export type MatchedSessionWithMetadata = MatchedSession & {
  match: SessionMatch;
};

export type { MatchedSession };

const lastDayOf = (days: string[]): string =>
  days.length > 0 ? (days.at(-1) ?? days[0]!) : "";
const firstDayOf = (days: string[]): string => days[0] ?? "";

const hydrate = async (
  matches: SessionMatch[]
): Promise<MatchedSessionWithMetadata[]> => {
  const [activities, workouts] = await Promise.all([
    db
      .table<CoachingActivityRecord>("coachingActivities")
      .where("id")
      .anyOf(matches.map((m) => m.coachingActivityId))
      .toArray(),
    db
      .table<WorkoutRecord>("workouts")
      .where("id")
      .anyOf(matches.map((m) => m.workoutId))
      .toArray(),
  ]);
  const aById = new Map(activities.map((a) => [a.id, a]));
  const wById = new Map(workouts.map((w) => [w.id, w]));

  const result: MatchedSessionWithMetadata[] = [];
  for (const match of matches) {
    const record = aById.get(match.coachingActivityId);
    const workout = wById.get(match.workoutId);
    if (!record || !workout) continue; // dangling-ref tolerance
    result.push({
      match,
      activity: toCoachingActivity(record),
      workout,
      complianceScore: computeComplianceScore(
        parseCoachingDuration(record.duration),
        workout.raw?.duration?.value
      ),
    });
  }
  return result;
};

export function useMatchedSessions(
  profileId: string | null,
  days: string[]
): MatchedSessionWithMetadata[] | undefined {
  return useLiveQuery<MatchedSessionWithMetadata[]>(async () => {
    if (!profileId || days.length === 0) return [];
    const matches = await db
      .table<SessionMatch>("sessionMatches")
      .where("[profileId+date]")
      .between(
        [profileId, firstDayOf(days)],
        [profileId, lastDayOf(days)],
        true,
        true
      )
      .toArray();
    if (matches.length === 0) return [];
    return hydrate(matches);
  }, [profileId, days.join(",")]);
}
