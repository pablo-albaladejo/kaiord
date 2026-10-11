import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { getCharacterCountClasses, getTextareaClasses } from "./styles";

export type StepNotesEditorProps = {
  value?: string;
  onChange: (notes: string) => void;
  disabled?: boolean;
  className?: string;
};

const MAX_CHARACTERS = 256;

export const StepNotesEditor = ({
  value = "",
  onChange,
  disabled = false,
  className = "",
}: StepNotesEditorProps) => {
  const t = useTranslate("editor");
  const [localValue, setLocalValue] = useState(value);
  const characterCount = localValue.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor="step-notes"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t("notes.label")}
      </label>
      <textarea
        id="step-notes"
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={t("notes.placeholder")}
        rows={3}
        className={getTextareaClasses(isOverLimit)}
        aria-describedby="character-count"
        aria-invalid={isOverLimit}
      />
      <div
        id="character-count"
        className={getCharacterCountClasses(isOverLimit)}
        role="status"
        aria-live="polite"
      >
        {t("notes.count", { n: characterCount, max: MAX_CHARACTERS })}
        {isOverLimit && (
          <span className="ml-2">
            {t("notes.over", { n: characterCount - MAX_CHARACTERS })}
          </span>
        )}
      </div>
    </div>
  );
};
