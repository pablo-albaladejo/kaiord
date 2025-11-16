import { useEffect } from "react";

type KeyboardShortcutHandlers = {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      const isModifier = event.ctrlKey || event.metaKey;

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
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, onUndo, onRedo]);
}
