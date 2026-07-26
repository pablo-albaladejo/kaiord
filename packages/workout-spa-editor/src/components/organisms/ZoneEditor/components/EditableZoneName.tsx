/**
 * EditableZoneName Component
 *
 * Inline editable text cell for a zone name.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type EditableZoneNameProps = {
  name: string;
  onSave: (name: string) => void;
  ariaLabel: string;
};

export function EditableZoneName({
  name,
  onSave,
  ariaLabel,
}: EditableZoneNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  const startEdit = useCallback(() => {
    cancelledRef.current = false;
    setDraft(name);
    setEditing(true);
  }, [name]);

  // Select the field's contents once editing begins so the name can be
  // overtyped. Using an effect (not requestAnimationFrame) keeps this
  // deterministic: a deferred rAF could fire mid-keystroke and reselect,
  // dropping the first typed character.
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (cancelledRef.current) return;
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onSave(trimmed);
  }, [draft, name, onSave]);

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
        className="flex-1 cursor-pointer text-left text-sm
          text-gray-800 hover:underline dark:text-gray-200"
      >
        {name}
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
      className="flex-1 rounded border border-blue-400 bg-white px-1
        text-sm dark:border-blue-500 dark:bg-gray-800"
    />
  );
}
