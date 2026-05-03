/**
 * useAutoMatchSuggestions — surfaces the auto-match heuristic output
 * for the visible week, filtered against the per-pair dismissal state.
 *
 * The heuristic itself (`autoMatchSessions`) is unchanged from the
 * archived design D2 — same threshold, same `same date AND same sport`
 * gating, same greedy pairing. The filter happens at the consumer
 * layer: each suggestion is dropped if `isAutoMatchBannerDismissed`
 * returns true for `(profileId, weekStart, activityId, workoutId)`.
 *
 * Reactivity comes from `useLiveQuery` over `autoMatchDismissals`
 * keyed on `(profileId, weekStart)` plus the source tables Dexie
 * already triggers re-fires for (`session_matches`, `coachingActivities`,
 * `workouts`). When a Reject upserts a dismissal row, the next render
 * sees the row hidden — no manual reload.
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

    const suggestions = await autoMatchSessions(
      { profileId, weekStart },
      {
        coachingRepository: createDexieCoachingRepository(db),
        workoutRepository: createDexieWorkoutRepository(db),
        repository: createDexieSessionMatchRepository(db),
      }
    );
    if (suggestions.length === 0) return [];

    const dismissalRepo = createDexieAutoMatchDismissalRepository(db);
    const visible: MatchSuggestion[] = [];
    for (const s of suggestions) {
      const dismissed = await isAutoMatchBannerDismissed(
        {
          profileId,
          weekStart,
          activityId: s.activityId,
          workoutId: s.workoutId,
        },
        { repository: dismissalRepo }
      );
      if (!dismissed) visible.push(s);
    }
    return visible;
  }, [profileId, weekStart]);
}
