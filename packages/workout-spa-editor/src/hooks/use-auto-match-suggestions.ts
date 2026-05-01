/**
 * useAutoMatchSuggestions — gates `autoMatchSessions` enumeration by
 * the 24h dismissal state. Returns [] when the banner is dismissed
 * for the (profileId, weekStart) pair within the TTL window.
 *
 * Uses Dexie liveQuery so the hook re-fires on:
 *   - changes to `auto_match_dismissals` (Dismiss-all flips the gate)
 *   - changes to `session_matches` (Accept removes a candidate)
 *   - changes to `coachingActivities` / `workouts` (sync brings new
 *     candidates into scope)
 */

import { useLiveQuery } from "dexie-react-hooks";

import { createDexieAutoMatchDismissalRepository } from "../adapters/dexie/dexie-auto-match-dismissal-repository";
import { createDexieCoachingRepository } from "../adapters/dexie/dexie-coaching-repository";
import { db } from "../adapters/dexie/dexie-database";
import { createDexieSessionMatchRepository } from "../adapters/dexie/dexie-session-match-repository";
import { createDexieWorkoutRepository } from "../adapters/dexie/dexie-workout-repository";
import { isAutoMatchBannerDismissed } from "../application/auto-match-dismissal";
import { autoMatchSessions } from "../application/auto-match-sessions";
import type { MatchSuggestion } from "../application/match-suggestion";

export function useAutoMatchSuggestions(
  profileId: string | null,
  weekStart: string
): MatchSuggestion[] | undefined {
  return useLiveQuery<MatchSuggestion[]>(async () => {
    if (!profileId || !weekStart) return [];
    const dismissalRepo = createDexieAutoMatchDismissalRepository(db);
    const dismissed = await isAutoMatchBannerDismissed(
      { profileId, weekStart, now: new Date() },
      { repository: dismissalRepo }
    );
    if (dismissed) return [];

    return autoMatchSessions(
      { profileId, weekStart },
      {
        coachingRepository: createDexieCoachingRepository(db),
        workoutRepository: createDexieWorkoutRepository(db),
        repository: createDexieSessionMatchRepository(db),
      }
    );
  }, [profileId, weekStart]);
}
