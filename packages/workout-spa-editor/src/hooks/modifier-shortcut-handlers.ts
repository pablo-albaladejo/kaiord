import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

export function handleAltShortcuts(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers
): boolean {
  if (event.key === "ArrowUp") {
    const handled = handlers.onMoveStepUp?.() ?? false;
    if (handled) event.preventDefault();
    return handled;
  }
  if (event.key === "ArrowDown") {
    const handled = handlers.onMoveStepDown?.() ?? false;
    if (handled) event.preventDefault();
    return handled;
  }
  return false;
}

export function handleModifierShortcuts(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers
): boolean {
  const key = event.key.toLowerCase();
  const shift = event.shiftKey;
  let handled = false;

  if (key === "s" && !shift) {
    handled = handlers.onSave?.() ?? false;
  } else if (key === "z" && !shift) {
    handled = handlers.onUndo?.() ?? false;
  } else if (key === "y" || (shift && key === "z")) {
    handled = handlers.onRedo?.() ?? false;
  } else if (key === "c" && !shift) {
    handled = handlers.onCopy?.() ?? false;
  } else if (key === "x" && !shift) {
    handled = handlers.onCut?.() ?? false;
  } else if (key === "v" && !shift) {
    handled = handlers.onPaste?.() ?? false;
  } else if (key === "g" && !shift) {
    handled = handlers.onCreateBlock?.() ?? false;
  } else if (key === "g" && shift) {
    handled = handlers.onUngroupBlock?.() ?? false;
  } else if (key === "a" && !shift) {
    handled = handlers.onSelectAll?.() ?? false;
  }

  if (handled) event.preventDefault();
  return handled;
}
