import { useCallback } from "react";

import { useCapabilities } from "../contexts/capabilities-context";
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
 * and `enabled` mirrors that thunk's own guard. A command an off Capability
 * owns is left out here, so the palette, the context menu and the coach
 * marks never offer it.
 */
export function useEditorCommands() {
  const store = useContextMenuStore();
  const capabilities = useCapabilities();
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
  ].filter((command) => capabilities.offers("command", command.id));

  return {
    commands,
    selectedStepId: store.selectedStepId,
    selectedStepIds: store.selectedStepIds,
    selectStep: store.selectStep,
    clearStepSelection: store.clearStepSelection,
  };
}
