/**
 * EditableZoneValue Component
 *
 * Inline editable numeric cell for zone min/max values.
 * Displays text normally; click to edit, blur/Enter to save.
 */

import { useCallback, useRef, useState } from "react";

type EditableZoneValueProps = {
  value: string;
  onSave: (raw: string) => void;
  ariaLabel: string;
};

export function EditableZoneValue({
  value,
  onSave,
  ariaLabel,
}: EditableZoneValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  const startEdit = useCallback(() => {
    cancelledRef.current = false;
    setDraft(value);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (!cancelledRef.current && draft !== value) onSave(draft);
  }, [draft, value, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      cancelledRef.current = true;
      setEditing(false);
    }
  }, []);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        aria-label={ariaLabel}
        className="cursor-pointer rounded px-1 font-mono text-sm
          text-gray-600 hover:bg-gray-200
          dark:text-gray-400 dark:hover:bg-gray-700"
      >
        {value}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className="w-16 rounded border border-blue-400 bg-white px-1
        font-mono text-sm dark:bg-gray-800"
    />
  );
}
