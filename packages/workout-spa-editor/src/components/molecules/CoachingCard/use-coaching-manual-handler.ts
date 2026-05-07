/**
 * Manual-create handler for the coaching dialog (per design D4).
 *
 * "Edit manually" creates a workout in `state="structured"` with a
 * 1-step warmup KRD template, persists the auto-match invariant (D1),
 * and navigates to the editor. The KRD is intentionally minimal — the
 * user fills in steps from the read-only coach description sidebar
 * (rendered in EditorPage from PR 3).
 */
import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { convertCoachingActivityManual } from "../../../application/coaching/convert-coaching-activity-manual";
import { useAnalytics } from "../../../contexts/analytics-context";
import { usePersistence } from "../../../contexts/persistence-context";
import type { CoachingActivity } from "../../../types/coaching-activity";

export type UseCoachingManual = {
  creating: boolean;
  error: string | null;
  clearError: () => void;
  startManual: () => Promise<void>;
};

export const useCoachingManual = (
  activity: CoachingActivity | null,
  profileId: string | null,
  onClose: () => void
): UseCoachingManual => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const [, navigate] = useLocation();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startManual = useCallback(async () => {
    if (!activity || !profileId) return;
    setError(null);
    setCreating(true);
    try {
      const result = await convertCoachingActivityManual(
        { activityId: activity.id },
        {
          coaching: persistence.coaching,
          workouts: persistence.workouts,
          sessionMatches: persistence.sessionMatch,
          analytics,
          newWorkoutId: () => crypto.randomUUID(),
          newMatchId: () => crypto.randomUUID(),
          clock: () => new Date().toISOString(),
        }
      );
      onClose();
      navigate(`/workout/${result.workoutId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manual creation failed");
    } finally {
      setCreating(false);
    }
  }, [activity, profileId, persistence, analytics, navigate, onClose]);

  return {
    creating,
    error,
    clearError: () => setError(null),
    startManual,
  };
};
