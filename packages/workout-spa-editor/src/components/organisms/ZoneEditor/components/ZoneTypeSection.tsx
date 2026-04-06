/**
 * ZoneTypeSection Component
 *
 * Wrapper for each zone type within a sport tab.
 * Shows method dropdown and editable zone content.
 */

import { useZoneCallbacks } from "../hooks/useZoneCallbacks";
import type { ZoneRowData } from "../types/zone-table";
import { ZoneMethodSelect } from "./ZoneMethodSelect";
import { ZoneTable } from "./ZoneTable";

type ZoneTypeSectionProps = {
  title: string;
  method: string;
  zones: Array<ZoneRowData>;
  zoneDisplayType: "heartRate" | "power" | "pace";
  onMethodChange: (method: string) => void;
  onZonesChange: (zones: Array<ZoneRowData>) => void;
  onAddZone?: () => void;
  threshold?: number;
};

export function ZoneTypeSection({
  title,
  method,
  zones,
  zoneDisplayType,
  onMethodChange,
  onZonesChange,
  onAddZone,
  threshold,
}: ZoneTypeSectionProps) {
  const isCustom = method === "custom";

  const callbacks = useZoneCallbacks({
    zones,
    type: zoneDisplayType,
    threshold,
    onZonesChange,
  });

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
        zones={zones}
        type={zoneDisplayType}
        threshold={threshold}
        isCustom={isCustom}
        callbacks={callbacks}
        onAddZone={onAddZone}
      />
    </div>
  );
}
