/**
 * SportZoneTabs Component
 *
 * Tab selector for sport-specific zone editing.
 */

import type { SportKey } from "../../../../types/sport-zones";

const SPORT_TABS: Array<{ id: SportKey; label: string }> = [
  { id: "cycling", label: "Cycling" },
  { id: "running", label: "Running" },
  { id: "swimming", label: "Swimming" },
  { id: "generic", label: "Generic" },
];

type SportZoneTabsProps = {
  activeSport: SportKey;
  onSportChange: (sport: SportKey) => void;
};

export function SportZoneTabs({
  activeSport,
  onSportChange,
}: SportZoneTabsProps) {
  return (
    <div
      role="tablist"
      className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
    >
      {SPORT_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeSport === tab.id}
          onClick={() => onSportChange(tab.id)}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeSport === tab.id
              ? "border-b-2 border-blue-600 bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
