/**
 * useSplitCoachingWorkout — UI-side wrapper around `splitCoachingWorkout`: the
 * Match goes and a Workout built from the Activity is detached from it, so
 * the split stays split. Idempotent on a missing row (no-op).
 */

import { useCallback } from "react";

import { splitCoachingWorkout } from "../application/coaching/split-coaching-workout";
import { usePersistence } from "../contexts/persistence-context";

export function useSplitCoachingWorkout() {
  const persistence = usePersistence();
  return useCallback(
    (input: { profileId: string; matchId: string }): Promise<void> =>
      splitCoachingWorkout(
        { ...persistence, clock: () => new Date().toISOString() },
        input
      ),
    [persistence]
  );
}
