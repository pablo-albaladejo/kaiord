import { type FormEvent, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

export type InlineNameEditProps = {
  /** The name being edited; the field starts with it. */
  value: string;
  /** Accessible name of the field. */
  label: string;
  /** Saves the name; resolves whether it was saved. */
  onSave: (name: string) => Promise<boolean>;
  /** Leaves edit mode, after a save or a cancel. */
  onDone: () => void;
};

/**
 * A name edited in place: the field, Save and Cancel. Enter saves, Escape
 * cancels, and a blank name keeps Save disabled. The user asked to edit, so
 * the field takes the focus.
 */
export function InlineNameEdit({
  value,
  label,
  onSave,
  onDone,
}: InlineNameEditProps) {
  const t = useTranslate("athlete");
  const [name, setName] = useState(value);
  const blank = name.trim() === "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (blank) return;
    void onSave(name).then((saved) => saved && onDone());
  };

  return (
    <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={submit}>
      <input
        type="text"
        value={name}
        aria-label={label}
        maxLength={100}
        // Opened on request, so the field takes the focus.
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        className="min-w-0 flex-1 rounded-lg border border-edge bg-surface px-3 py-1.5 text-[15px] text-ink-strong focus:border-accent focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={blank}>
        {t("athletes.save")}
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={onDone}>
        {t("athletes.cancel")}
      </Button>
    </form>
  );
}
