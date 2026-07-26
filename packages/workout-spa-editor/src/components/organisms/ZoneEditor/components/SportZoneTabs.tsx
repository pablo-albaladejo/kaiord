/**
 * SportZoneTabs Component
 *
 * Tab selector for sport-specific zone editing.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import type { SportKey } from "../../../../types/sport-zones";

const SPORT_IDS: Array<SportKey> = [
  "cycling",
  "running",
  "swimming",
  "generic",
];

type SportZoneTabsProps = {
  activeSport: SportKey;
  onSportChange: (sport: SportKey) => void;
};

export function SportZoneTabs({
  activeSport,
  onSportChange,
}: SportZoneTabsProps) {
  const t = useTranslate("zones");
  return (
    <div
      role="tablist"
      className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
    >
      {SPORT_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeSport === id}
          onClick={() => onSportChange(id)}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeSport === id
              ? "border-b-2 border-blue-600 bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {t(`tabs.${id}`)}
        </button>
      ))}
    </div>
  );
}
