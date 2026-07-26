/**
 * ZoneRow Component
 *
 * Single zone row with editable name, min/max values, and optional delete.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import type { ZoneRowData, ZoneTableCallbacks } from "../types/zone-table";
import { getZoneColor } from "../utils/zone-colors";
import { extractValues, formatSecondary } from "../utils/zone-values";
import { EditableZoneName } from "./EditableZoneName";
import { EditableZoneValue } from "./EditableZoneValue";

const TYPE_KEYS = {
  heartRate: "hr",
  power: "power",
  pace: "pace",
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
  const t = useTranslate("zones");
  const { minStr, maxStr } = extractValues(zone, type, threshold);
  const secondary = formatSecondary(zone, type, threshold);
  const prefix = t(`zoneType.${TYPE_KEYS[type]}`);

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
        ariaLabel={t("table.zoneNameAria", { prefix, zone: zone.zone })}
      />
      <EditableZoneValue
        value={minStr}
        onSave={(v) => callbacks.onMinChange(index, v)}
        ariaLabel={t("table.zoneMinAria", { prefix, zone: zone.zone })}
      />
      <span className="text-xs text-gray-500">-</span>
      <EditableZoneValue
        value={maxStr}
        onSave={(v) => callbacks.onMaxChange(index, v)}
        ariaLabel={t("table.zoneMaxAria", { prefix, zone: zone.zone })}
      />
      {secondary && <span className="text-xs text-gray-400">{secondary}</span>}
      {isCustom && (
        <button
          type="button"
          onClick={() => callbacks.onRemove(index)}
          aria-label={t("table.removeZoneAria", { prefix, zone: zone.zone })}
          className="ml-1 text-xs text-red-500 hover:text-red-700"
        >
          x
        </button>
      )}
    </div>
  );
}
