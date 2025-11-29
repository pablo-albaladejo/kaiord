import type { Target } from "../../../types/krd";
import type { HeartRateZone, PowerZone, Profile } from "../../../types/profile";
import type { TargetUnitOption } from "./TargetPicker.types";
import { getValueLabel, getValuePlaceholder } from "./helpers-labels";

export { getValueLabel, getValuePlaceholder };

export const getTargetTypeFromValue = (
  value: Target | null
): "power" | "heart_rate" | "pace" | "cadence" | "open" => {
  if (!value) return "open";
  if (
    value.type === "power" ||
    value.type === "heart_rate" ||
    value.type === "pace" ||
    value.type === "cadence" ||
    value.type === "open"
  ) {
    return value.type;
  }
  return "open";
};

export const getUnitOptions = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  activeProfile?: Profile | null
): Array<TargetUnitOption> => {
  switch (targetType) {
    case "power":
      return [
        { value: "watts", label: "Watts" },
        { value: "percent_ftp", label: "% FTP" },
        {
          value: "zone",
          label: activeProfile ? "Power Zone" : "Power Zone (no profile)",
        },
        { value: "range", label: "Range" },
      ];
    case "heart_rate":
      return [
        { value: "bpm", label: "BPM" },
        {
          value: "zone",
          label: activeProfile ? "HR Zone" : "HR Zone (no profile)",
        },
        { value: "percent_max", label: "% Max HR" },
        { value: "range", label: "Range" },
      ];
    case "pace":
      return [
        { value: "mps", label: "m/s" },
        { value: "zone", label: "Pace Zone" },
        { value: "range", label: "Range" },
      ];
    case "cadence":
      return [
        { value: "rpm", label: "RPM" },
        { value: "range", label: "Range" },
      ];
    case "open":
      return [];
  }
};

export const getCurrentUnit = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  return value.value.unit;
};

export const getValueString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit === "range") return "";
  return String(value.value.value || "");
};

export const getRangeMinString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return String(value.value.min || "");
};

export const getRangeMaxString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return String(value.value.max || "");
};

export const getPowerZoneName = (
  zoneNumber: number,
  powerZones: Array<PowerZone>
): string | null => {
  const zone = powerZones.find((z) => z.zone === zoneNumber);
  return zone ? zone.name : null;
};

export const getHeartRateZoneName = (
  zoneNumber: number,
  heartRateZones: Array<HeartRateZone>
): string | null => {
  const zone = heartRateZones.find((z) => z.zone === zoneNumber);
  return zone ? zone.name : null;
};

export const calculatePowerFromZone = (
  zoneNumber: number,
  powerZones: Array<PowerZone>,
  ftp?: number
): { min: number; max: number } | null => {
  if (!ftp) return null;
  const zone = powerZones.find((z) => z.zone === zoneNumber);
  if (!zone) return null;

  return {
    min: Math.round((ftp * zone.minPercent) / 100),
    max: Math.round((ftp * zone.maxPercent) / 100),
  };
};

export const calculateHeartRateFromZone = (
  zoneNumber: number,
  heartRateZones: Array<HeartRateZone>
): { min: number; max: number } | null => {
  const zone = heartRateZones.find((z) => z.zone === zoneNumber);
  if (!zone) return null;

  return {
    min: zone.minBpm,
    max: zone.maxBpm,
  };
};
