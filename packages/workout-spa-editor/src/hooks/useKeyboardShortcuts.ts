import { useEffect } from "react";

type KeyboardShortcutHandlers = {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onMoveStepUp?: () => void;
  onMoveStepDown?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
};

export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onMoveStepUp,
  onMoveStepDown,
  onCopy,
  onPaste,
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
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, onUndo, onRedo, onMoveStepUp, onMoveStepDown, onCopy, onPaste]);
}
