import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { Target } from "../../../types/krd";
import type { Profile } from "../../../types/profile";
import { getValueLabel, getValuePlaceholder } from "./helpers-labels";
import type { TargetUnitOption } from "./TargetPicker.types";

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
  activeProfile?: Profile | null,
  t: Translate = getTranslate("targets")
): Array<TargetUnitOption> => {
  switch (targetType) {
    case "power":
      return [
        { value: "watts", label: t("unit.watts") },
        { value: "percent_ftp", label: t("unit.percentFtp") },
        {
          value: "zone",
          label: activeProfile
            ? t("unit.powerZone")
            : t("unit.powerZoneNoProfile"),
        },
        { value: "range", label: t("unit.range") },
      ];
    case "heart_rate":
      return [
        { value: "bpm", label: t("unit.bpm") },
        {
          value: "zone",
          label: activeProfile ? t("unit.hrZone") : t("unit.hrZoneNoProfile"),
        },
        { value: "percent_max", label: t("unit.percentMaxHr") },
        { value: "range", label: t("unit.range") },
      ];
    case "pace":
      return [
        { value: "mps", label: t("unit.mps") },
        { value: "zone", label: t("unit.paceZone") },
        { value: "range", label: t("unit.range") },
      ];
    case "cadence":
      return [
        { value: "rpm", label: t("unit.rpm") },
        { value: "range", label: t("unit.range") },
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
