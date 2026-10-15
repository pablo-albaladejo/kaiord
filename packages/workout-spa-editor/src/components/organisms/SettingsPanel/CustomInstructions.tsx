import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { type AutosaveStatus, usePromptAutosave } from "./use-prompt-autosave";

type CustomInstructionsProps = {
  /** The stored instructions; `undefined` while they load. */
  value: string | undefined;
  onSave: (value: string) => Promise<boolean>;
};

const STATUS_KEY: Partial<Record<AutosaveStatus, string>> = {
  saving: "prompt.saving",
  saved: "prompt.saved",
  failed: "prompt.failed",
};

export function CustomInstructions({ value, onSave }: CustomInstructionsProps) {
  const t = useTranslate("settings");
  // The athlete's text wins over the stored one once they start typing, so a
  // save landing mid-sentence never rewinds the field.
  const [draft, setDraft] = useState<string | null>(null);
  const { status, change, flush } = usePromptAutosave(onSave);
  const statusKey = STATUS_KEY[status];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-ink-body">
        {t("prompt.title")}
      </h3>
      <label
        htmlFor="ai-custom-system-prompt"
        className="mb-2 block text-sm text-ink-body"
      >
        {t("ai.customInstructionsLabel")}
      </label>
      <textarea
        id="ai-custom-system-prompt"
        className="w-full rounded-lg border border-edge bg-surface p-3 text-sm text-ink-strong"
        rows={3}
        maxLength={500}
        placeholder={t("ai.customInstructionsPlaceholder")}
        value={draft ?? value ?? ""}
        onChange={(e) => {
          setDraft(e.target.value);
          change(e.target.value);
        }}
        onBlur={flush}
      />
      <p
        role="status"
        className={`m-0 min-h-5 text-xs ${status === "failed" ? "text-danger-text" : "text-ink-muted"}`}
      >
        {statusKey ? t(statusKey) : ""}
      </p>
    </div>
  );
}
