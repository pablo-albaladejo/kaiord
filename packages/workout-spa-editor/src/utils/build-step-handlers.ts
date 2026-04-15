import type { KeyboardShortcutHandlers } from "../hooks/keyboard-shortcut-handlers";
import { buildClipboardHandlers } from "./build-clipboard-handlers";
import type { KeyboardHandlerDeps } from "./keyboard-handler-deps";

type StepHandlers = Pick<
  KeyboardShortcutHandlers,
  | "onMoveStepUp"
  | "onMoveStepDown"
  | "onCopy"
  | "onCut"
  | "onPaste"
  | "onDelete"
  | "onCreateBlock"
  | "onUngroupBlock"
  | "onSelectAll"
>;

export const buildStepHandlers = (
  deps: KeyboardHandlerDeps,
  hasClipboard: () => boolean
): StepHandlers => ({
  onMoveStepUp: () => {
    const idx = deps.stepIndex();
    if (idx === null || idx <= 0) return false;
    deps.reorderStep(idx, idx - 1);
    return true;
  },
  onMoveStepDown: () => {
    const idx = deps.stepIndex();
    if (idx === null || !deps.workout) return false;
    if (idx >= deps.workout.steps.length - 1) return false;
    deps.reorderStep(idx, idx + 1);
    return true;
  },
  ...buildClipboardHandlers(deps, hasClipboard),
  onCreateBlock: () => {
    if (deps.selectedStepIds.length < 2) return false;
    deps.openCreateBlockDialog();
    return true;
  },
  onUngroupBlock: () => {
    if (!deps.selectedStepId) return false;
    if (!deps.selectedStepId.startsWith("block-")) return false;
    deps.ungroupRepetitionBlock(deps.selectedStepId);
    return true;
  },
  onSelectAll: () => {
    if (!deps.workout) return false;
    const ids = deps.workout.steps
      .filter((step) => "stepIndex" in step)
      .map((step) => `step-${(step as { stepIndex: number }).stepIndex}`);
    if (ids.length === 0) return false;
    deps.selectAllSteps(ids);
    return true;
  },
});
