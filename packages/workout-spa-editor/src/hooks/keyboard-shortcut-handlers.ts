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
};

function isFormElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement &&
      (target.isContentEditable || target.contentEditable === "true"))
  );
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
    if (!isModifier) return;
    const handled = handleModifierShortcuts(event, handlers);
    if (handled) return;
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
