import { isFormElement } from "../utils/is-form-element";
import {
  handleAltShortcuts,
  handleModifierShortcuts,
} from "./modifier-shortcut-handlers";

export type KeyboardShortcutHandlers = {
  onSave?: () => boolean;
  onUndo?: () => boolean;
  onRedo?: () => boolean;
  onMoveStepUp?: () => boolean;
  onMoveStepDown?: () => boolean;
  onCopy?: () => boolean;
  onPaste?: () => boolean;
  onCut?: () => boolean;
  onDelete?: () => boolean;
  onCreateBlock?: () => boolean;
  onUngroupBlock?: () => boolean;
  onSelectAll?: () => boolean;
  onClearSelection?: () => boolean;
  onShowShortcuts?: () => boolean;
};

// `Record<keyof …, true>` is exhaustive in both directions at compile time:
// a new handler without an entry fails to type-check, and an entry for a
// removed handler does too. HANDLER_KEYS is the runtime mirror the shortcut
// catalog is paired against.
const HANDLER_KEY_MAP: Record<keyof KeyboardShortcutHandlers, true> = {
  onSave: true,
  onUndo: true,
  onRedo: true,
  onMoveStepUp: true,
  onMoveStepDown: true,
  onCopy: true,
  onPaste: true,
  onCut: true,
  onDelete: true,
  onCreateBlock: true,
  onUngroupBlock: true,
  onSelectAll: true,
  onClearSelection: true,
  onShowShortcuts: true,
};

export const HANDLER_KEYS = Object.keys(HANDLER_KEY_MAP) as ReadonlyArray<
  keyof KeyboardShortcutHandlers
>;

function handlePlainKeys(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers
): void {
  // `?` is Shift+/ on most layouts, so match the character it produces.
  if (event.key === "?") {
    if (handlers.onShowShortcuts?.()) event.preventDefault();
    return;
  }
  if (event.key !== "Delete" && event.key !== "Backspace") return;
  if (handlers.onDelete?.()) event.preventDefault();
}

/** Create a keydown handler for modifier-based shortcuts. */
export function createKeyDownHandler(
  handlers: KeyboardShortcutHandlers
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    if (isFormElement(event.target)) return;
    const isModifier = event.ctrlKey || event.metaKey;
    if (event.altKey && !isModifier) {
      if (handleAltShortcuts(event, handlers)) return;
    }
    if (!isModifier) {
      handlePlainKeys(event, handlers);
      return;
    }
    handleModifierShortcuts(event, handlers);
  };
}

/** Create a keydown handler for the Escape key. */
export function createEscapeHandler(
  onClearSelection?: () => boolean
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    if (isFormElement(event.target)) return;
    if (event.key === "Escape") {
      const handled = onClearSelection?.() ?? false;
      if (handled) event.preventDefault();
    }
  };
}
