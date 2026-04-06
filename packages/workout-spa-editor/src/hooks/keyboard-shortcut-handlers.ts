import {
  handleAltShortcuts,
  handleModifierShortcuts,
} from "./modifier-shortcut-handlers";

export type KeyboardShortcutHandlers = {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onMoveStepUp?: () => void;
  onMoveStepDown?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCreateBlock?: () => void;
  onUngroupBlock?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
};

function isFormElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
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
    handleModifierShortcuts(event, handlers);
  };
}

/** Create a keydown handler for the Escape key. */
export function createEscapeHandler(
  onClearSelection?: () => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    if (isFormElement(event.target)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClearSelection?.();
    }
  };
}
