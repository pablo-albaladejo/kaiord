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
    const idx = deps.stepIndex();
    if (idx === null || !deps.workout) return false;
    const step = deps.workout.steps[idx];
    if (!step || !("stepIndex" in step)) return false;
    void deps.copyStep(step.stepIndex);
    return true;
  },
  onCut: () => {
    const idx = deps.stepIndex();
    if (idx === null || !deps.workout) return false;
    if (deps.selectedStepIds.length > 1) return false;
    const step = deps.workout.steps[idx];
    if (!step || !("stepIndex" in step)) return false;
    void deps.copyStep(step.stepIndex);
    deps.deleteStep(step.stepIndex);
    return true;
  },
  onPaste: () => {
    if (!hasClipboard()) return false;
    const idx = deps.stepIndex();
    if (idx !== null) {
      void deps.pasteStep(idx + 1);
    } else if (deps.workout) {
      void deps.pasteStep(deps.workout.steps.length);
    } else {
      return false;
    }
    return true;
  },
  onDelete: () => {
    const idx = deps.stepIndex();
    if (idx === null || !deps.workout) return false;
    const step = deps.workout.steps[idx];
    if (!step || !("stepIndex" in step)) return false;
    deps.deleteStep(step.stepIndex);
    return true;
  },
});
