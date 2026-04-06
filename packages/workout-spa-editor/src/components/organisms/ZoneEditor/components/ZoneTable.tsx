/**
 * ZoneTable Component
 *
 * Renders editable zone rows with inline editing for names and values.
 */

import type { ZoneRowData, ZoneTableCallbacks } from "../types/zone-table";
import { ZoneRow } from "./ZoneRow";

type ZoneTableProps = {
  zones: Array<ZoneRowData>;
  type: "heartRate" | "power" | "pace";
  threshold?: number;
  isCustom: boolean;
  callbacks: ZoneTableCallbacks;
  onAddZone?: () => void;
};

export function ZoneTable({
  zones,
  type,
  threshold,
  isCustom,
  callbacks,
  onAddZone,
}: ZoneTableProps) {
  if (zones.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No zones configured
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {zones.map((zone, i) => (
        <ZoneRow
          key={zone.zone}
          zone={zone}
          index={i}
          type={type}
          threshold={threshold}
          isCustom={isCustom}
          callbacks={callbacks}
        />
      ))}
      {isCustom && onAddZone && (
        <button
          type="button"
          onClick={onAddZone}
          className="mt-2 rounded border border-dashed border-gray-300 px-3
            py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500
            dark:border-gray-600 dark:text-gray-400"
        >
          + Add Zone
        </button>
      )}
    </div>
  );
}
