import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

/**
 * Ctrl+K/⌘K — the only binding dispatched before the form-field guard, so it
 * opens the palette from inside an input too. Returns `true` for any matched
 * chord (handled or not) so the caller stops: the combination has no other
 * meaning in the app. `Shift` and `Alt` variants fall through untouched.
 */
export function handleCommandPaletteKey(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandlers
): boolean {
  if (event.altKey || event.shiftKey) return false;
  if (!event.ctrlKey && !event.metaKey) return false;
  if (event.key.toLowerCase() !== "k") return false;
  if (handlers.onShowCommandPalette?.() ?? false) event.preventDefault();
  return true;
}

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

/** Dispatch unmodified keys: the `?` sheet and Delete/Backspace. */
export function handlePlainKeys(
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
