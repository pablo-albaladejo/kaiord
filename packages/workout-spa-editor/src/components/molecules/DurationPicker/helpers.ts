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

export const getDurationValueString = (value: Duration | null): string => {
  if (!value) return "";
  if (value.type === "time") return value.seconds.toString();
  if (value.type === "distance") return value.meters.toString();
  return "";
};

export const getValueLabel = (durationType: "time" | "distance" | "open") => {
  if (durationType === "time") return "Duration (seconds)";
  if (durationType === "distance") return "Distance (meters)";
  return "";
};

export const getValuePlaceholder = (
  durationType: "time" | "distance" | "open"
) => {
  if (durationType === "time") return "e.g., 300 (5 minutes)";
  if (durationType === "distance") return "e.g., 1000 (1 km)";
  return "";
};
