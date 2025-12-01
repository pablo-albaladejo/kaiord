import type { Target } from "../../../types/krd";
import type { Profile } from "../../../types/profile";
import type { TargetUnitOption } from "./TargetPicker.types";
import { getValueLabel, getValuePlaceholder } from "./helpers-labels";

export {
  calculateHeartRateFromZone,
  calculatePowerFromZone,
  getHeartRateZoneName,
  getPowerZoneName,
} from "./helpers-zones";
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

export {
  getCurrentUnit,
  getRangeMaxString,
  getRangeMinString,
  getValueString,
} from "./helpers-values";
