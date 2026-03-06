/**
 * ZoneTypeSection Component
 *
 * Wrapper for each zone type within a sport tab.
 * Shows method dropdown and zone content.
 */

import { ZoneMethodSelect } from "./ZoneMethodSelect";
import { ZoneTable } from "./ZoneTable";

type ZoneTypeSectionProps = {
  title: string;
  method: string;
  zones: Array<Record<string, unknown>>;
  zoneDisplayType: "heartRate" | "power" | "pace";
  onMethodChange: (method: string) => void;
  threshold?: number;
};

export function ZoneTypeSection({
  title,
  method,
  zones,
  zoneDisplayType,
  onMethodChange,
  threshold,
}: ZoneTypeSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h4>
        <ZoneMethodSelect
          type={zoneDisplayType === "heartRate" ? "hr" : zoneDisplayType}
          value={method}
          onChange={onMethodChange}
        />
      </div>
      <ZoneTable
        zones={zones as never}
        type={zoneDisplayType}
        threshold={threshold}
      />
    </div>
  );
}
