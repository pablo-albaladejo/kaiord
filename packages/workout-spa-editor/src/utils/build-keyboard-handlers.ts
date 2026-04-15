/**
 * Build Keyboard Handlers
 *
 * Creates the keyboard shortcut handler configuration for the app.
 * Each handler returns true when the action was performed, false
 * when a guard prevents it (enabling context-aware preventDefault).
 */

import type { KeyboardShortcutHandlers } from "../hooks/keyboard-shortcut-handlers";
import { hasClipboardContent } from "../store/clipboard-store";
import { buildStepHandlers } from "./build-step-handlers";
import { saveWorkout } from "./save-workout";

export type { KeyboardHandlerDeps } from "./keyboard-handler-deps";

import type { KeyboardHandlerDeps } from "./keyboard-handler-deps";

export const buildKeyboardHandlers = (
  deps: KeyboardHandlerDeps
): KeyboardShortcutHandlers => ({
  onSave: () => {
    if (deps.currentWorkout) saveWorkout(deps.currentWorkout);
    return true;
  },
  onUndo: () => {
    if (deps.canUndo) deps.undo();
    return true;
  },
  onRedo: () => {
    if (deps.canRedo) deps.redo();
    return true;
  },
  ...buildStepHandlers(deps, hasClipboardContent),
  onClearSelection: () => {
    if (!deps.selectedStepId && deps.selectedStepIds.length === 0) {
      return false;
    }
    deps.clearStepSelection();
    deps.selectStep(null);
    return true;
  },
});
