/**
 * ZoneTypeSection Component
 *
 * Wrapper for each zone type within a sport tab.
 * Shows auto/manual toggle and zone content.
 */

import { ZoneTable } from "./ZoneTable";
import type { ZoneMode } from "../../../../types/sport-zones";

type ZoneTypeSectionProps = {
  title: string;
  mode: ZoneMode;
  zones: Array<Record<string, unknown>>;
  zoneDisplayType: "heartRate" | "power" | "pace";
  onToggleMode: (mode: ZoneMode) => void;
};

export function ZoneTypeSection({
  title,
  mode,
  zones,
  zoneDisplayType,
  onToggleMode,
}: ZoneTypeSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {mode === "auto" ? "Auto" : "Manual"}
          </span>
          <button
            type="button"
            onClick={() => onToggleMode(mode === "auto" ? "manual" : "auto")}
            aria-label={`Switch ${title} to ${mode === "auto" ? "manual" : "auto"} mode`}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              mode === "auto" ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                mode === "auto" ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
      <ZoneTable
        zones={zones as never}
        type={zoneDisplayType}
        readOnly={mode === "auto"}
      />
    </div>
  );
}
