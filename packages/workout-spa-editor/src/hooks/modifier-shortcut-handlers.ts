import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

export function handleAltShortcuts(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers
): boolean {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    handlers.onMoveStepUp?.();
    return true;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    handlers.onMoveStepDown?.();
    return true;
  }
  return false;
}

export function handleModifierShortcuts(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers
): void {
  const key = event.key.toLowerCase();
  const shift = event.shiftKey;

  if (key === "s") {
    event.preventDefault();
    handlers.onSave?.();
  } else if (key === "z" && !shift) {
    event.preventDefault();
    handlers.onUndo?.();
  } else if (key === "y" || (shift && key === "z")) {
    event.preventDefault();
    handlers.onRedo?.();
  } else if (key === "c") {
    event.preventDefault();
    handlers.onCopy?.();
  } else if (key === "v") {
    event.preventDefault();
    handlers.onPaste?.();
  } else if (key === "g" && !shift) {
    event.preventDefault();
    handlers.onCreateBlock?.();
  } else if (key === "g" && shift) {
    event.preventDefault();
    handlers.onUngroupBlock?.();
  } else if (key === "a") {
    event.preventDefault();
    handlers.onSelectAll?.();
  }
}
