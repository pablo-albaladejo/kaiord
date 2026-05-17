/**
 * Match/split action handlers for `useCoachingDialog`.
 *
 * Extracted into its own module so the parent hook stays under the
 * function- and file-size lint caps. Captures every dependency
 * explicitly — no fallback to `getActiveId()` at submit time.
 */

import { useCallback, useState } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import type { ActivityMatchState } from "../../../hooks/use-activity-match-state";
import { useMatchSession } from "../../../hooks/use-match-session";
import { useUnmatchSession } from "../../../hooks/use-unmatch-session";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { toPersistedCoachingActivityId } from "../../../types/coaching-activity-record";

export type UseCoachingDialogActions = {
  matching: boolean;
  splitting: boolean;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  handleSelectWorkout: (workoutId: string) => Promise<void>;
  handleSplit: () => Promise<void>;
};

export const useCoachingDialogActions = (
  activity: CoachingActivity | null,
  targetProfileId: string | null,
  matchState: ActivityMatchState | undefined
): UseCoachingDialogActions => {
  const [matching, setMatching] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const matchSession = useMatchSession();
  const unmatchSession = useUnmatchSession();
  const { success: showSuccess } = useToastContext();

  const handleSelectWorkout = useCallback(
    async (workoutId: string) => {
      if (!activity || !targetProfileId || matching) return;
      setMatching(true);
      try {
        await matchSession({
          profileId: targetProfileId,
          coachingActivityId: toPersistedCoachingActivityId(
            targetProfileId,
            activity.id
          ),
          workoutId,
          source: "manual",
        });
        // Static title satisfies R-PIIInterpolation; the dynamic
        // activity title flows through the description field.
        showSuccess("Workout matched", activity.title, { duration: 3000 });
        setPickerOpen(false);
      } finally {
        setMatching(false);
      }
    },
    [activity, targetProfileId, matching, matchSession, showSuccess]
  );

  const handleSplit = useCallback(async () => {
    if (!targetProfileId || matchState?.kind !== "matched" || splitting) return;
    setSplitting(true);
    try {
      await unmatchSession({
        profileId: targetProfileId,
        matchId: matchState.matchId,
      });
    } finally {
      setSplitting(false);
    }
  }, [targetProfileId, matchState, splitting, unmatchSession]);

  return {
    matching,
    splitting,
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
    handleSelectWorkout,
    handleSplit,
  };
};
