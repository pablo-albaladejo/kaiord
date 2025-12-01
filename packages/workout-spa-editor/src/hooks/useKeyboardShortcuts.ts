/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { useEffect } from "react";

type KeyboardShortcutHandlers = {
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

export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onMoveStepUp,
  onMoveStepDown,
  onCopy,
  onPaste,
  onCreateBlock,
  onUngroupBlock,
  onSelectAll,
  onClearSelection,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      const isModifier = event.ctrlKey || event.metaKey;

      // Alt+Up/Down for reordering (Requirement 29)
      if (event.altKey && !isModifier) {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onMoveStepUp?.();
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          onMoveStepDown?.();
          return;
        }
      }

      if (!isModifier) return;

      // Ctrl+S / Cmd+S - Save
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        onSave?.();
        return;
      }

      // Ctrl+Z / Cmd+Z - Undo
      if (event.key === "z" || event.key === "Z") {
        if (!event.shiftKey) {
          event.preventDefault();
          onUndo?.();
          return;
        }
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z - Redo
      if (
        event.key === "y" ||
        event.key === "Y" ||
        (event.shiftKey && (event.key === "z" || event.key === "Z"))
      ) {
        event.preventDefault();
        onRedo?.();
        return;
      }

      // Ctrl+C / Cmd+C - Copy (Requirement 39.2)
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        onCopy?.();
        return;
      }

      // Ctrl+V / Cmd+V - Paste (Requirement 39.2)
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        onPaste?.();
        return;
      }

      // Ctrl+G / Cmd+G - Create repetition block (Requirement 7.6.1)
      if ((event.key === "g" || event.key === "G") && !event.shiftKey) {
        event.preventDefault();
        onCreateBlock?.();
        return;
      }

      // Ctrl+Shift+G / Cmd+Shift+G - Ungroup repetition block (Requirement 7.6.2)
      if ((event.key === "g" || event.key === "G") && event.shiftKey) {
        event.preventDefault();
        onUngroupBlock?.();
        return;
      }

      // Ctrl+A / Cmd+A - Select all steps (Requirement 7.6.3)
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        onSelectAll?.();
        return;
      }
    };

    // Handle Escape key separately (no modifier needed)
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClearSelection?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [
    onSave,
    onUndo,
    onRedo,
    onMoveStepUp,
    onMoveStepDown,
    onCopy,
    onPaste,
    onCreateBlock,
    onUngroupBlock,
    onSelectAll,
    onClearSelection,
  ]);
}
