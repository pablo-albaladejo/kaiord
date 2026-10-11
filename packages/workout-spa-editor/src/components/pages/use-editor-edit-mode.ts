import { useCallback } from "react";

import { useWorkoutStore } from "../../store/workout-store";
import { useConfirmDiscardEdits } from "./use-confirm-discard-edits";
import { useEditorActions } from "./use-editor-actions";
import { useEditorSave } from "./use-editor-save";
import { useWorkoutRecord } from "./use-workout-record";

/** The editor on a persisted workout: its record, push, save and discard. */
export function useEditorEditMode(id: string | undefined) {
  const loaded = useWorkoutRecord(id);
  const actions = useEditorActions(loaded.record);
  const edits = useEditorSave(actions.saveEdits, loaded);
  const confirmDiscard = useConfirmDiscardEdits(edits);
  const { setBaselineKrd } = loaded;

  // A send persists the draft too, so it is the new saved copy.
  const pushWorkout = useCallback(
    async (garminPushId: string) => {
      const draft = useWorkoutStore.getState().currentWorkout;
      await actions.pushWorkout(garminPushId);
      if (draft) setBaselineKrd(draft);
    },
    [actions, setBaselineKrd]
  );

  // Discard on a persisted workout drops the unsaved edits, after asking.
  const editDiscard = loaded.record
    ? { onDiscard: () => confirmDiscard(), disabled: !edits.isDirty }
    : undefined;

  return { ...loaded, pushWorkout, edits, confirmDiscard, editDiscard };
}
