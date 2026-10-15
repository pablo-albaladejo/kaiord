import { useRef, useState } from "react";

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
  // Enter or Escape settles the input; a blur fired while it unmounts must
  // neither commit twice nor commit a value the athlete just cancelled.
  const settled = useRef(false);
  const cancel = () => {
    settled.current = true;
    onCancel();
  };
  const commit = () => {
    if (settled.current) return;
    settled.current = true;
    const id = value.trim();
    if (id) onCommit(id);
    else cancel();
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
        if (e.key === "Escape") cancel();
      }}
    />
  );
}
