/**
 * CoachNotesField Component
 *
 * Textarea for workout-level coach notes (the canonical KRD `notes`),
 * e.g. Train2Go coach instructions with markdown links.
 */

import { useTranslate } from "../../../../i18n/use-translate";

type CoachNotesFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CoachNotesField({ value, onChange }: CoachNotesFieldProps) {
  const t = useTranslate("editor");
  return (
    <div>
      <label
        htmlFor="workout-coach-notes"
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t("metadata.notesLabel")}
      </label>
      <textarea
        id="workout-coach-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("metadata.notesPlaceholder")}
        rows={3}
        aria-label={t("metadata.notesAria")}
        data-testid="workout-coach-notes-input"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
}
