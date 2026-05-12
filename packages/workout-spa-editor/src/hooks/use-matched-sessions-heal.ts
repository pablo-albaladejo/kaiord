/**
 * One-shot in-app heal trigger for `useMatchedSessions.hydrate` drops.
 *
 * When the calendar's live query drops a `SessionMatch` because its
 * `coachingActivityId` does not join to any `coachingActivities` row,
 * this hook schedules a single `healSessionMatchIdShape` attempt per
 * `(matchId)` guarded by a ref. The next `useLiveQuery` tick after
 * Dexie writes back the canonical COMPOSITE id surfaces the matched
 * pair to the bucketer.
 *
 * See `.omc/autopilot/bug-trace.md` §H8 and `.omc/plans/autopilot-impl.md`
 * Task 4 for the design.
 */

import { useEffect, useRef } from "react";

import { healSessionMatchIdShape } from "../application/coaching/heal-session-match-id-shape";
import { usePersistence } from "../contexts/persistence-context";
import type { SessionMatch } from "../types/session-match";

export type DanglingMatch = { match: SessionMatch; hadWorkout: boolean };

export const useMatchedSessionsHeal = (
  dangling: readonly DanglingMatch[] | null
): void => {
  const persistence = usePersistence();
  const healedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!dangling || dangling.length === 0) return;
    for (const { match, hadWorkout } of dangling) {
      if (!hadWorkout) continue;
      if (healedRef.current.has(match.id)) continue;
      healedRef.current.add(match.id);
      queueMicrotask(() => {
        void healSessionMatchIdShape(
          { match },
          {
            coaching: persistence.coaching,
            workouts: persistence.workouts,
            sessionMatches: persistence.sessionMatch,
          }
        );
      });
    }
  }, [dangling, persistence]);
};
