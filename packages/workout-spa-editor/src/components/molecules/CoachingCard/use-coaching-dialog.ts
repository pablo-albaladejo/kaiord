/**
 * Hook backing CoachingActivityDialog: lazy description load, 3-state
 * dispatch (no-workout / converted / matched per design D5), auto-heal
 * for legacy converted-without-match rows (D8 belt-and-braces), AI/
 * Manual creation handlers, and match/split actions.
 *
 * `dialogState` is the single source of truth for which UI to render —
 * the JSX never branches on workout-existence directly.
 */

import type { ActivityMatchState } from "../../../hooks/use-activity-match-state";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { ExpandActivity } from "../../../types/coaching-expand-result";
import type { UseCoachingAi } from "./use-coaching-ai-handler";
import { useCoachingAi } from "./use-coaching-ai-handler";
import { useCoachingAutoHeal } from "./use-coaching-auto-heal";
import { useCoachingConvert } from "./use-coaching-convert";
import { useCoachingDialogActions } from "./use-coaching-dialog-actions";
import type { DescriptionLoad } from "./use-coaching-dialog-helpers";
import {
  toMatchState,
  useExpandActivityOnOpen,
  useTargetProfileId,
} from "./use-coaching-dialog-helpers";
import type { CoachingDialogState } from "./use-coaching-dialog-state";
import { useCoachingDialogState } from "./use-coaching-dialog-state";
import type { UseCoachingManual } from "./use-coaching-manual-handler";
import { useCoachingManual } from "./use-coaching-manual-handler";
import { useCoachingDialogStateObserved } from "./use-coaching-state-observed";

export type UseCoachingDialog = {
  error: string | null;
  converting: boolean;
  descriptionLoad: DescriptionLoad;
  matchState: ActivityMatchState | undefined;
  dialogState: CoachingDialogState | undefined;
  matching: boolean;
  splitting: boolean;
  pickerOpen: boolean;
  targetProfileId: string | null;
  ai: UseCoachingAi;
  manual: UseCoachingManual;
  handleConvert: () => Promise<void>;
  openPicker: () => void;
  closePicker: () => void;
  handleSelectWorkout: (workoutId: string) => Promise<void>;
  handleSplit: () => Promise<void>;
};

export const useCoachingDialog = (
  activity: CoachingActivity | null,
  onClose: () => void,
  expandActivity: ExpandActivity
): UseCoachingDialog => {
  const targetProfileId = useTargetProfileId(activity);
  const descriptionLoad = useExpandActivityOnOpen(activity, expandActivity);
  const dialogState = useCoachingDialogState(targetProfileId, activity);
  const matchState = toMatchState(dialogState);
  useCoachingAutoHeal(activity, targetProfileId, dialogState);
  useCoachingDialogStateObserved(activity, dialogState);
  const actions = useCoachingDialogActions(
    activity,
    targetProfileId,
    matchState
  );
  const ai = useCoachingAi(activity, targetProfileId, onClose, expandActivity);
  const manual = useCoachingManual(
    activity,
    targetProfileId,
    onClose,
    expandActivity
  );
  const convert = useCoachingConvert(activity, targetProfileId, onClose);
  return {
    error: convert.error,
    converting: convert.converting,
    descriptionLoad,
    matchState,
    dialogState,
    targetProfileId,
    ai,
    manual,
    handleConvert: convert.handleConvert,
    ...actions,
  };
};
