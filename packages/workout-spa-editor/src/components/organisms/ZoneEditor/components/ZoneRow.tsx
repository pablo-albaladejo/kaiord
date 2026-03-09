/**
 * ZoneRow Component
 *
 * Single zone row with editable name, min/max values, and optional delete.
 */

import { EditableZoneName } from "./EditableZoneName";
import { EditableZoneValue } from "./EditableZoneValue";
import { getZoneColor } from "../utils/zone-colors";
import { extractValues, formatSecondary } from "../utils/zone-values";
import type { ZoneRowData, ZoneTableCallbacks } from "../types/zone-table";

const TYPE_LABELS = {
  heartRate: "HR",
  power: "Power",
  pace: "Pace",
} as const;

type ZoneRowProps = {
  zone: ZoneRowData;
  index: number;
  type: "heartRate" | "power" | "pace";
  threshold?: number;
  isCustom: boolean;
  callbacks: ZoneTableCallbacks;
};

export function ZoneRow({
  zone,
  index,
  type,
  threshold,
  isCustom,
  callbacks,
}: ZoneRowProps) {
  const { minStr, maxStr } = extractValues(zone, type, threshold);
  const secondary = formatSecondary(zone, type, threshold);
  const prefix = TYPE_LABELS[type];

  return (
    <div
      className={`flex items-center gap-2 rounded px-3 py-1.5 ${getZoneColor(zone.zone)}`}
    >
      <span className="w-6 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
        Z{zone.zone}
      </span>
      <EditableZoneName
        name={zone.name}
        onSave={(n) => callbacks.onNameChange(index, n)}
        ariaLabel={`${prefix} Zone ${zone.zone} name`}
      />
      <EditableZoneValue
        value={minStr}
        onSave={(v) => callbacks.onMinChange(index, v)}
        ariaLabel={`${prefix} Zone ${zone.zone} min`}
      />
      <span className="text-xs text-gray-500">-</span>
      <EditableZoneValue
        value={maxStr}
        onSave={(v) => callbacks.onMaxChange(index, v)}
        ariaLabel={`${prefix} Zone ${zone.zone} max`}
      />
      {secondary && <span className="text-xs text-gray-400">{secondary}</span>}
      {isCustom && (
        <button
          type="button"
          onClick={() => callbacks.onRemove(index)}
          aria-label={`Remove ${prefix} zone ${zone.zone}`}
          className="ml-1 text-xs text-red-500 hover:text-red-700"
        >
          x
        </button>
      )}
    </div>
  );
}
