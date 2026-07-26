import { getTranslate, type Translate } from "../../../i18n/use-translate";

export const getValueLabel = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  t: Translate = getTranslate("targets")
): string => {
  if (unit === "range") {
    return t("valueLabel.range");
  }

  switch (targetType) {
    case "power":
      if (unit === "watts") return t("valueLabel.powerWatts");
      if (unit === "percent_ftp") return t("valueLabel.powerPercentFtp");
      if (unit === "zone") return t("valueLabel.powerZone");
      return t("valueLabel.powerValue");
    case "heart_rate":
      if (unit === "bpm") return t("valueLabel.hrBpm");
      if (unit === "zone") return t("valueLabel.hrZone");
      if (unit === "percent_max") return t("valueLabel.hrPercentMax");
      return t("valueLabel.hrValue");
    case "pace":
      if (unit === "mps") return t("valueLabel.paceMps");
      if (unit === "zone") return t("valueLabel.paceZone");
      return t("valueLabel.paceValue");
    case "cadence":
      if (unit === "rpm") return t("valueLabel.cadenceRpm");
      return t("valueLabel.cadenceValue");
    default:
      return t("valueLabel.value");
  }
};

export const getValuePlaceholder = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  t: Translate = getTranslate("targets")
): string => {
  if (unit === "range") {
    return "";
  }

  switch (targetType) {
    case "power":
      if (unit === "watts") return t("placeholder.powerWatts");
      if (unit === "percent_ftp") return t("placeholder.powerPercentFtp");
      if (unit === "zone") return t("placeholder.powerZone");
      return t("placeholder.enterValue");
    case "heart_rate":
      if (unit === "bpm") return t("placeholder.hrBpm");
      if (unit === "zone") return t("placeholder.hrZone");
      if (unit === "percent_max") return t("placeholder.hrPercentMax");
      return t("placeholder.enterValue");
    case "pace":
      if (unit === "mps") return t("placeholder.paceMps");
      if (unit === "zone") return t("placeholder.paceZone");
      return t("placeholder.enterValue");
    case "cadence":
      if (unit === "rpm") return t("placeholder.cadenceRpm");
      return t("placeholder.enterValue");
    default:
      return t("placeholder.enterValue");
  }
};
