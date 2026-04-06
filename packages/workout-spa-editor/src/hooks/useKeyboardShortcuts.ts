import { useEffect } from "react";
import {
  createKeyDownHandler,
  createEscapeHandler,
} from "./keyboard-shortcut-handlers";
import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

export type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = createKeyDownHandler(handlers);
    const handleEscape = createEscapeHandler(handlers.onClearSelection);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [
    handlers.onSave,
    handlers.onUndo,
    handlers.onRedo,
    handlers.onMoveStepUp,
    handlers.onMoveStepDown,
    handlers.onCopy,
    handlers.onPaste,
    handlers.onCreateBlock,
    handlers.onUngroupBlock,
    handlers.onSelectAll,
    handlers.onClearSelection,
  ]);
}
