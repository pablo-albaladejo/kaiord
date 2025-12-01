import { useState } from "react";
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
        Notes & Coaching Cues
      </label>
      <textarea
        id="step-notes"
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Add coaching cues or notes for this step..."
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
        {characterCount} / {MAX_CHARACTERS} characters
        {isOverLimit && (
          <span className="ml-2">
            ({characterCount - MAX_CHARACTERS} over limit)
          </span>
        )}
      </div>
    </div>
  );
};
