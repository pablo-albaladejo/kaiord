/**
 * Hook backing CoachingActivityDialog: lazy description load + convert
 * + match/split actions.
 *
 * Captures `targetProfileId` on dialog open so a profile switch while
 * the dialog is open does NOT redirect any write to the wrong profile
 * (mirrors the `linkAccount` profile-switch-safe pattern). Match/split
 * handlers live in `use-coaching-dialog-actions.ts` so this orchestrator
 * stays under the function- and file-size lint caps.
 */

import { useEffect, useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import {
  type ActivityMatchState,
  useActivityMatchState,
} from "../../../hooks/use-activity-match-state";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useCoachingConvert } from "./use-coaching-convert";
import { useCoachingDialogActions } from "./use-coaching-dialog-actions";

export type UseCoachingDialog = {
  error: string | null;
  converting: boolean;
  matchState: ActivityMatchState | undefined;
  matching: boolean;
  splitting: boolean;
  pickerOpen: boolean;
  targetProfileId: string | null;
  handleConvert: () => Promise<void>;
  openPicker: () => void;
  closePicker: () => void;
  handleSelectWorkout: (workoutId: string) => Promise<void>;
  handleSplit: () => Promise<void>;
};

export const useCoachingDialog = (
  activity: CoachingActivity | null,
  onClose: () => void,
  expandActivity: (activity: CoachingActivity) => void
): UseCoachingDialog => {
  const activeProfileId = useActiveProfileLive()?.id ?? null;
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!activity) {
      setTargetProfileId(null);
      return;
    }
    setTargetProfileId((prev) => prev ?? activeProfileId);
  }, [activity, activeProfileId]);

  useEffect(() => {
    if (!activity || !activeProfileId) return;
    if (activity.description !== undefined) return;
    expandActivity(activity);
  }, [activity, activeProfileId, expandActivity]);

  const matchState = useActivityMatchState(
    targetProfileId,
    activity?.id ?? null
  );
  const actions = useCoachingDialogActions(
    activity,
    targetProfileId,
    matchState
  );
  const { error, converting, handleConvert } = useCoachingConvert(
    activity,
    targetProfileId,
    onClose
  );

  return {
    error,
    converting,
    matchState,
    targetProfileId,
    handleConvert,
    ...actions,
  };
};
