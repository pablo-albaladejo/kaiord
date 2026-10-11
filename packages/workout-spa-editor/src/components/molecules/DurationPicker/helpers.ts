import { getTranslate, type Translate } from "../../../i18n/use-translate";
import { formatClock } from "../../../lib/units/clock";
import type { Duration } from "../../../types/krd";

export const getDurationTypeFromValue = (
  value: Duration | null
): "time" | "distance" | "open" => {
  if (!value) return "time";
  if (
    value.type === "time" ||
    value.type === "distance" ||
    value.type === "open"
  ) {
    return value.type;
  }
  return "time";
};

/** The input's text: a time reads as m:ss, a distance in meters. */
export const getDurationValueString = (value: Duration | null): string => {
  if (!value) return "";
  if (value.type === "time") return formatClock(value.seconds);
  if (value.type === "distance") return value.meters.toString();
  return "";
};

export const getValueLabel = (
  durationType: "time" | "distance" | "open",
  t: Translate = getTranslate("editor")
) => {
  if (durationType === "time") return t("durationPicker.timeLabel");
  if (durationType === "distance") return t("durationPicker.distanceLabel");
  return "";
};

export const getValuePlaceholder = (
  durationType: "time" | "distance" | "open",
  t: Translate = getTranslate("editor")
) => {
  if (durationType === "time") return t("durationPicker.timePlaceholder");
  if (durationType === "distance")
    return t("durationPicker.distancePlaceholder");
  return "";
};
