import type { KeyboardShortcutHandlers } from "../hooks/keyboard-shortcut-handlers";
import type { KeyboardHandlerDeps } from "./keyboard-handler-deps";

type ClipboardHandlers = Pick<
  KeyboardShortcutHandlers,
  "onCopy" | "onCut" | "onPaste" | "onDelete"
>;

export const buildClipboardHandlers = (
  deps: KeyboardHandlerDeps,
  hasClipboard: () => boolean
): ClipboardHandlers => ({
  onCopy: () => {
    const selectedStepIndex = deps.stepIndex();
    if (selectedStepIndex === null || !deps.workout) return false;
    const step = deps.workout.steps[selectedStepIndex];
    if (!step || !("stepIndex" in step)) return false;
    void deps.copyStep(step.stepIndex);
    return true;
  },
  onCut: () => {
    const selectedStepIndex = deps.stepIndex();
    if (selectedStepIndex === null || !deps.workout) return false;
    if (deps.selectedStepIds.length > 1) return false;
    const step = deps.workout.steps[selectedStepIndex];
    if (!step || !("stepIndex" in step)) return false;
    void deps.copyStep(step.stepIndex);
    deps.deleteStep(step.stepIndex);
    return true;
  },
  onPaste: () => {
    if (!hasClipboard()) return false;
    const selectedStepIndex = deps.stepIndex();
    if (selectedStepIndex !== null) {
      void deps.pasteStep(selectedStepIndex + 1);
    } else if (deps.workout) {
      void deps.pasteStep(deps.workout.steps.length);
    } else {
      return false;
    }
    return true;
  },
  onDelete: () => {
    const selectedStepIndex = deps.stepIndex();
    if (selectedStepIndex === null || !deps.workout) return false;
    const step = deps.workout.steps[selectedStepIndex];
    if (!step || !("stepIndex" in step)) return false;
    deps.deleteStep(step.stepIndex);
    return true;
  },
});
