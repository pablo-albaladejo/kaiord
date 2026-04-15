import { useCallback } from "react";

import { hasClipboardContent } from "../store/clipboard-store";
import type { Workout } from "../types/krd";
import { buildKeyboardHandlers } from "../utils/build-keyboard-handlers";
import { getSelectedStepIndex } from "../utils/get-selected-step-index";
import { useContextMenuStore } from "./use-context-menu-store";

export function useEditorContextMenu() {
  const store = useContextMenuStore();
  const workout = store.currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  const stepIndex = useCallback(
    () => getSelectedStepIndex(store.selectedStepId, workout),
    [store.selectedStepId, workout]
  );

  const handlers = buildKeyboardHandlers({ ...store, workout, stepIndex });
  const sid = store.selectedStepId;
  const hasSingle = !!sid && !sid.startsWith("block-");
  const hasSelection = !!sid || store.selectedStepIds.length > 0;
  const hasSteps = !!workout && workout.steps.length > 0;
  const hasClipboard = hasClipboardContent();

  return {
    handlers,
    hasAnyAction: hasSelection || hasClipboard || hasSteps,
    showCut: hasSingle,
    showCopy: hasSingle,
    showPaste: hasClipboard,
    showDelete: hasSelection,
    showSelectAll: hasSteps,
    showGroup: store.selectedStepIds.length >= 2,
    showUngroup: !!sid?.startsWith("block-"),
    selectedStepId: sid,
    selectedStepIds: store.selectedStepIds,
    selectStep: store.selectStep,
    clearStepSelection: store.clearStepSelection,
  };
}
