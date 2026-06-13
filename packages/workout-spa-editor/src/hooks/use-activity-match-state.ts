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

import { usePersistence } from "../contexts/persistence-context";
import type { WorkoutRecord } from "../types/calendar-record";
import { toPersistedCoachingActivityId } from "../types/coaching-activity-record";

export type ActivityMatchState =
  | { kind: "solo" }
  | { kind: "matched"; matchId: string; workout: WorkoutRecord };

/**
 * @param activityViewModelId the in-memory `CoachingActivity.id`
 *   (SHORT form `"${source}:${sourceId}"`). The hook composes the
 *   canonical COMPOSITE persisted shape via `toPersistedCoachingActivityId`
 *   before asking the read-model for `sessionMatches.[profileId+coachingActivityId]`,
 *   matching the COMPOSITE shape every writer persists. See
 *   `.omc/autopilot/bug-trace.md` §H7 for the original divergence.
 *
 * Reads go through `matchedSessionsReadModel` (not `db` directly); its Dexie
 * adapter issues the same observable queries, so `useLiveQuery` reactivity is
 * preserved while the persistence boundary stays behind the port.
 */
export function useActivityMatchState(
  profileId: string | null,
  activityViewModelId: string | null
): ActivityMatchState | undefined {
  const { matchedSessionsReadModel } = usePersistence();
  return useLiveQuery<ActivityMatchState>(async () => {
    if (!profileId || !activityViewModelId) return { kind: "solo" };

    // Dangling-ref tolerance lives in the read-model: a missing workout
    // (mid-cascade race) returns null, which we render as solo so the dialog
    // shows the manual-match affordances until the cascade hooks reconcile.
    const match = await matchedSessionsReadModel.findActivityMatch(
      profileId,
      toPersistedCoachingActivityId(profileId, activityViewModelId)
    );

    if (!match) return { kind: "solo" };

    return { kind: "matched", matchId: match.matchId, workout: match.workout };
  }, [profileId, activityViewModelId, matchedSessionsReadModel]);
}
