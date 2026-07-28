import { useCallback } from "react";

import { hasClipboardContent } from "../store/clipboard-store";
import { useContextMenuStore } from "../store/selectors";
import type { Workout } from "../types/krd";
import { buildKeyboardHandlers } from "../utils/build-keyboard-handlers";
import { getSelectedStepIndex } from "../utils/get-selected-step-index";
import { buildDoCommands } from "./build-do-commands";
import { buildLearnCommands } from "./build-learn-commands";
import type { EditorCommand } from "./editor-command.types";
import { buildEditorCommandGuards } from "./editor-command-guards";

export type { EditorCommand } from "./editor-command.types";

/**
 * The one enumerable source of editor commands. `run` always delegates to a
 * `buildKeyboardHandlers` thunk, so no surface re-implements a store action,
 * and `enabled` mirrors that thunk's own guard.
 */
export function useEditorCommands() {
  const store = useContextMenuStore();
  const workout = store.currentWorkout?.extensions?.structured_workout as
    Workout | undefined;

  const stepIndex = useCallback(
    () => getSelectedStepIndex(store.selectedStepId, workout),
    [store.selectedStepId, workout]
  );

  const handlers = buildKeyboardHandlers({ ...store, workout, stepIndex });
  const commands: ReadonlyArray<EditorCommand> = [
    ...buildDoCommands({
      handlers,
      guards: buildEditorCommandGuards({
        currentWorkout: store.currentWorkout,
        workout,
        selectedStepId: store.selectedStepId,
        selectedStepIds: store.selectedStepIds,
        hasClipboard: hasClipboardContent(),
        canUndo: store.canUndo,
        canRedo: store.canRedo,
      }),
    }),
    ...buildLearnCommands(),
  ];

  return {
    commands,
    selectedStepId: store.selectedStepId,
    selectedStepIds: store.selectedStepIds,
    selectStep: store.selectStep,
    clearStepSelection: store.clearStepSelection,
  };
}
