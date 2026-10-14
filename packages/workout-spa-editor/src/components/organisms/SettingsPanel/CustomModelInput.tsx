import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";

type CustomModelInputProps = {
  onCommit: (modelId: string) => void;
  onCancel: () => void;
};

/** Free-text model id; commits on Enter or blur, never a blank one. */
export function CustomModelInput({
  onCommit,
  onCancel,
}: CustomModelInputProps) {
  const t = useTranslate("settings");
  const [value, setValue] = useState("");
  const commit = () => {
    const id = value.trim();
    if (id) onCommit(id);
    else onCancel();
  };
  return (
    <input
      data-testid="model-choice-custom"
      aria-label={t("models.customModelIdAriaLabel")}
      className="mt-2 w-full rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-ink-strong"
      placeholder={t("models.customModelIdPlaceholder")}
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}
