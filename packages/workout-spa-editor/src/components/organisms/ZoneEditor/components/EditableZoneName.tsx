/**
 * EditableZoneName Component
 *
 * Inline editable text cell for a zone name.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useTranslate } from "../../../../i18n/use-translate";
import { zoneNameLabel } from "../../../../lib/zone-name-label";

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
  const t = useTranslate("zones");
  const shown = zoneNameLabel(name, t);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shown);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  const startEdit = useCallback(() => {
    cancelledRef.current = false;
    setDraft(shown);
    setEditing(true);
  }, [shown]);

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
    if (trimmed && trimmed !== shown) onSave(trimmed);
  }, [draft, shown, onSave]);

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
        {shown}
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
      className="flex-1 rounded border border-accent bg-surface px-1
        text-sm"
    />
  );
}
