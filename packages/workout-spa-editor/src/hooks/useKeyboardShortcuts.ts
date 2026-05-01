import { useEffect } from "react";

import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";
import {
  createEscapeHandler,
  createKeyDownHandler,
} from "./keyboard-shortcut-handlers";

export type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  // TODO(fix-coaching-dialog-rules-of-hooks-followup): the explicit
  // per-handler deps are intentional — depending on the whole `handlers`
  // object would re-bind listeners on every parent render.
  /* eslint-disable react-hooks/exhaustive-deps */
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
    handlers.onCut,
    handlers.onPaste,
    handlers.onCreateBlock,
    handlers.onUngroupBlock,
    handlers.onSelectAll,
    handlers.onDelete,
    handlers.onClearSelection,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */
}
