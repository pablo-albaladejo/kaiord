/**
 * SportSelect Component
 *
 * Sport selection dropdown.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import type { Sport } from "../../../../types/krd";
import { SPORTS } from "../constants";

type SportSelectProps = {
  value: Sport;
  onChange: (sport: Sport) => void;
};

export function SportSelect({ value, onChange }: SportSelectProps) {
  const t = useTranslate("editor");
  return (
    <div>
      <label
        htmlFor="workout-sport"
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t("metadata.sportLabel")}
      </label>
      <select
        id="workout-sport"
        value={value}
        onChange={(e) => onChange(e.target.value as Sport)}
        aria-label={t("metadata.sportAria")}
        data-testid="workout-sport-select"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {SPORTS.map((s) => (
          <option key={s} value={s}>
            {t(`metadata.sport.${s}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
