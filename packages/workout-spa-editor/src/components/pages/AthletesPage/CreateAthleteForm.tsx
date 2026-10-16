import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { useProfileCreate } from "./hooks/useProfileCreate";

/** Creates an athlete by name; the field clears once it is saved. */
export function CreateAthleteForm() {
  const t = useTranslate("athlete");
  const [formData, setFormData] = useState({ name: "" });
  const { handleCreate } = useProfileCreate({ formData, setFormData });
  const blank = formData.name.trim() === "";

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        handleCreate();
      }}
    >
      <input
        type="text"
        value={formData.name}
        maxLength={100}
        onChange={(e) => setFormData({ name: e.target.value })}
        placeholder={t("athletes.newName")}
        aria-label={t("athletes.name")}
        className="min-w-0 flex-1 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink-strong focus:border-accent focus:outline-none"
      />
      <Button type="submit" disabled={blank}>
        {t("athletes.create")}
      </Button>
    </form>
  );
}
