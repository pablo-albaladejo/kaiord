/**
 * useZoneCallbacks Hook
 *
 * Builds callbacks for editing zone values, names, and custom operations.
 */

import { useCallback } from "react";
import { applyValueChange } from "../utils/parse-zone-field";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";
import type { ZoneTableCallbacks } from "../types/zone-table";

type ZoneRowData = HeartRateZone | PowerZone | PaceZone;

type UseZoneCallbacksArgs = {
  zones: Array<ZoneRowData>;
  type: "heartRate" | "power" | "pace";
  threshold?: number;
  onZonesChange: (zones: Array<ZoneRowData>) => void;
};

export function useZoneCallbacks({
  zones,
  type,
  threshold,
  onZonesChange,
}: UseZoneCallbacksArgs): ZoneTableCallbacks {
  const onNameChange = useCallback(
    (i: number, name: string) => {
      const updated = zones.map((z, idx) => (idx === i ? { ...z, name } : z));
      onZonesChange(updated);
    },
    [zones, onZonesChange]
  );

  const onMinChange = useCallback(
    (i: number, raw: string) => {
      const updated = applyValueChange(zones, i, "min", raw, type, threshold);
      if (updated) onZonesChange(updated);
    },
    [zones, type, threshold, onZonesChange]
  );

  const onMaxChange = useCallback(
    (i: number, raw: string) => {
      const updated = applyValueChange(zones, i, "max", raw, type, threshold);
      if (updated) onZonesChange(updated);
    },
    [zones, type, threshold, onZonesChange]
  );

  const onRemove = useCallback(
    (i: number) => {
      onZonesChange(zones.filter((_, idx) => idx !== i));
    },
    [zones, onZonesChange]
  );

  return { onNameChange, onMinChange, onMaxChange, onRemove };
}
