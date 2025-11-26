import { useState } from "react";

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
        className={`
          w-full rounded-md border px-3 py-2 text-sm
          focus:outline-none focus:ring-2
          disabled:cursor-not-allowed disabled:opacity-50
          dark:bg-gray-800 dark:text-gray-100
          ${
            isOverLimit
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600"
          }
        `}
        aria-describedby="character-count"
        aria-invalid={isOverLimit}
      />
      <div
        id="character-count"
        className={`text-xs ${
          isOverLimit
            ? "font-semibold text-red-600 dark:text-red-400"
            : "text-gray-500 dark:text-gray-400"
        }`}
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
