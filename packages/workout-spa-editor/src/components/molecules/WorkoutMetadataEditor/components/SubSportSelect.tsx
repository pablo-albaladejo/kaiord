/**
 * SubSportSelect Component
 *
 * Sub-sport selection dropdown.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import type { Sport, SubSport } from "../../../../types/krd";
import { SUB_SPORTS } from "../constants";

const GENERIC_ONLY: SubSport[] = ["generic"];

type SubSportSelectProps = {
  sport: Sport;
  value: SubSport;
  onChange: (subSport: SubSport) => void;
};

export function SubSportSelect({
  sport,
  value,
  onChange,
}: SubSportSelectProps) {
  const t = useTranslate("editor");
  return (
    <div>
      <label
        htmlFor="workout-sub-sport"
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {t("metadata.subSportLabel")}
      </label>
      <select
        id="workout-sub-sport"
        value={value}
        onChange={(e) => onChange(e.target.value as SubSport)}
        aria-label={t("metadata.subSportAria")}
        data-testid="workout-sub-sport-select"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {(SUB_SPORTS[sport] ?? GENERIC_ONLY).map((ss) => (
          <option key={ss} value={ss}>
            {t(`metadata.subSport.${ss}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
