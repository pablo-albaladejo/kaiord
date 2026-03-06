/**
 * ZoneTable Component
 *
 * Renders zone rows with real unit values as primary display.
 */

import { getZoneColor } from "../utils/zone-colors";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

type ZoneRow = HeartRateZone | PowerZone | PaceZone;

type ZoneTableProps = {
  zones: Array<ZoneRow>;
  type: "heartRate" | "power" | "pace";
  threshold?: number;
};

function formatPrimary(zone: ZoneRow, type: string, threshold?: number) {
  if (type === "heartRate") {
    const hr = zone as HeartRateZone;
    return `${hr.minBpm} - ${hr.maxBpm} bpm`;
  }
  if (type === "power") {
    const pw = zone as PowerZone;
    if (threshold) {
      const minW = Math.round((threshold * pw.minPercent) / 100);
      const maxW = Math.round((threshold * pw.maxPercent) / 100);
      return `${minW} - ${maxW}W`;
    }
    return `${pw.minPercent} - ${pw.maxPercent}%`;
  }
  const pace = zone as PaceZone;
  const toMmSs = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };
  return `${toMmSs(pace.minPace)} - ${toMmSs(pace.maxPace)}`;
}

function formatSecondary(zone: ZoneRow, type: string, threshold?: number) {
  if (type === "power" && threshold) {
    const pw = zone as PowerZone;
    return `(${pw.minPercent}-${pw.maxPercent}%)`;
  }
  return null;
}

export function ZoneTable({ zones, type, threshold }: ZoneTableProps) {
  if (zones.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No zones configured
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {zones.map((zone) => (
        <div
          key={zone.zone}
          className={`flex items-center gap-3 rounded px-3 py-1.5 ${getZoneColor(zone.zone)}`}
        >
          <span className="w-6 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
            Z{zone.zone}
          </span>
          <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">
            {zone.name}
          </span>
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
            {formatPrimary(zone, type, threshold)}
          </span>
          {formatSecondary(zone, type, threshold) && (
            <span className="text-xs text-gray-400">
              {formatSecondary(zone, type, threshold)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
