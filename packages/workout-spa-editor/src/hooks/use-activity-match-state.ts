/**
 * useActivityMatchState — reactive read of one coaching activity's
 * matched/solo status for a single profile.
 *
 * Returns:
 *   - undefined while resolving (consumers SHOULD render the
 *     pre-existing dialog skeleton, not a flicker between solo and
 *     matched);
 *   - { kind: "solo" } when no `SessionMatch` row exists for
 *     (profileId, activityId);
 *   - { kind: "matched", matchId, workout } otherwise.
 *
 * Lives in `hooks/` because it composes a `useLiveQuery` subscription
 * with a follow-up workout fetch. The dialog consumes the projection;
 * the use cases (`matchSession`, `unmatchSession`) own the writes.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../types/calendar-record";
import { toPersistedCoachingActivityId } from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";

export type ActivityMatchState =
  | { kind: "solo" }
  | { kind: "matched"; matchId: string; workout: WorkoutRecord };

/**
 * @param activityViewModelId the in-memory `CoachingActivity.id`
 *   (SHORT form `"${source}:${sourceId}"`). The hook composes the
 *   canonical COMPOSITE persisted shape via `toPersistedCoachingActivityId`
 *   before querying `sessionMatches.[profileId+coachingActivityId]`,
 *   matching the COMPOSITE shape every writer persists. See
 *   `.omc/autopilot/bug-trace.md` §H7 for the original divergence.
 */
export function useActivityMatchState(
  profileId: string | null,
  activityViewModelId: string | null
): ActivityMatchState | undefined {
  return useLiveQuery<ActivityMatchState>(async () => {
    if (!profileId || !activityViewModelId) return { kind: "solo" };

    const match = await db
      .table<SessionMatch>("sessionMatches")
      .where("[profileId+coachingActivityId]")
      .equals([
        profileId,
        toPersistedCoachingActivityId(profileId, activityViewModelId),
      ])
      .first();

    if (!match) return { kind: "solo" };

    const workout = await db
      .table<WorkoutRecord>("workouts")
      .get(match.workoutId);

    if (!workout) {
      // Dangling-ref tolerance: the match exists but the workout is
      // gone (mid-cascade race). Treat as solo so the dialog re-renders
      // the manual-match affordances; the cascade hooks will reconcile.
      return { kind: "solo" };
    }

    return { kind: "matched", matchId: match.id, workout };
  }, [profileId, activityViewModelId]);
}
