/**
 * Auto-heal effect for legacy "converted-without-match" workouts
 * (per design D8 belt-and-braces). On dialog open, if the dialog state
 * resolves to `"converted"`, we eagerly create the missing
 * `session_match` so the next render flips to `"matched"` and the UX
 * shows the canonical matched-state buttons. Idempotent — re-run is a
 * silent no-op once the match exists.
 */
import { useEffect, useRef } from "react";

import { ensureSessionMatch } from "../../../application/coaching/ensure-session-match";
import { useAnalytics } from "../../../contexts/analytics-context";
import { usePersistence } from "../../../contexts/persistence-context";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

export const useCoachingAutoHeal = (
  activity: CoachingActivity | null,
  profileId: string | null,
  dialogState: CoachingDialogState | undefined
): void => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const healedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activity || !profileId) return;
    if (dialogState?.kind !== "converted") return;
    const key = `${profileId}:${activity.id}:${dialogState.workout.id}`;
    if (healedRef.current === key) return;
    void (async () => {
      try {
        const result = await ensureSessionMatch(persistence.sessionMatch, {
          profileId,
          coachingActivityId: activity.id,
          workoutId: dialogState.workout.id,
          date: activity.date,
          source: "auto-coaching-v10-migration",
          newId: () => crypto.randomUUID(),
          clock: () => new Date().toISOString(),
        });
        healedRef.current = key;
        if (result.created) analytics.event("coaching.dialog.auto_healed");
      } catch (err) {
        analytics.event("coaching.dialog.auto_heal_failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }, [activity, profileId, dialogState, persistence, analytics]);
};
