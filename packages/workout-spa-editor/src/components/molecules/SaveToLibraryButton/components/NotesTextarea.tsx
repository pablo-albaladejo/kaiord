/**
 * NotesTextarea Component
 *
 * Textarea for workout notes with character counter.
 */

import { useTranslate } from "../../../../i18n/use-translate";

type NotesTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function NotesTextarea({
  value,
  onChange,
  disabled,
}: NotesTextareaProps) {
  const t = useTranslate("library");
  return (
    <div>
      <label
        htmlFor="workout-notes"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {t("saveDialog.notes.label")}
      </label>
      <textarea
        id="workout-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("saveDialog.notes.placeholder")}
        maxLength={1000}
        rows={3}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        disabled={disabled}
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t("saveDialog.notes.charCount", { count: value.length })}
      </p>
    </div>
  );
}
