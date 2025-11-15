import type { Target } from "../../../types/krd";
import type { TargetUnitOption } from "./TargetPicker.types";

/**
 * Get target type from Target value
 */
export const getTargetTypeFromValue = (
  value: Target | null
): "power" | "heart_rate" | "pace" | "cadence" | "open" => {
  if (!value) return "open";
  return value.type;
};

/**
 * Get unit options based on target type
 */
export const getUnitOptions = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open"
): Array<TargetUnitOption> => {
  switch (targetType) {
    case "power":
      return [
        { value: "watts", label: "Watts" },
        { value: "percent_ftp", label: "% FTP" },
        { value: "zone", label: "Power Zone" },
        { value: "range", label: "Range" },
      ];
    case "heart_rate":
      return [
        { value: "bpm", label: "BPM" },
        { value: "zone", label: "HR Zone" },
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

/**
 * Get current unit from Target value
 */
export const getCurrentUnit = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  return value.value.unit;
};

/**
 * Get value label based on target type and unit
 */
export const getValueLabel = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string
): string => {
  if (unit === "range") {
    return "Range";
  }

  switch (targetType) {
    case "power":
      if (unit === "watts") return "Power (watts)";
      if (unit === "percent_ftp") return "Power (% FTP)";
      if (unit === "zone") return "Power Zone (1-7)";
      return "Power Value";
    case "heart_rate":
      if (unit === "bpm") return "Heart Rate (BPM)";
      if (unit === "zone") return "HR Zone (1-5)";
      if (unit === "percent_max") return "Heart Rate (% Max)";
      return "Heart Rate Value";
    case "pace":
      if (unit === "mps") return "Pace (m/s)";
      if (unit === "zone") return "Pace Zone (1-5)";
      return "Pace Value";
    case "cadence":
      if (unit === "rpm") return "Cadence (RPM)";
      return "Cadence Value";
    default:
      return "Value";
  }
};

/**
 * Get placeholder text based on target type and unit
 */
export const getValuePlaceholder = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string
): string => {
  if (unit === "range") {
    return "";
  }

  switch (targetType) {
    case "power":
      if (unit === "watts") return "e.g., 250";
      if (unit === "percent_ftp") return "e.g., 85";
      if (unit === "zone") return "1-7";
      return "Enter value";
    case "heart_rate":
      if (unit === "bpm") return "e.g., 150";
      if (unit === "zone") return "1-5";
      if (unit === "percent_max") return "e.g., 85";
      return "Enter value";
    case "pace":
      if (unit === "mps") return "e.g., 3.5";
      if (unit === "zone") return "1-5";
      return "Enter value";
    case "cadence":
      if (unit === "rpm") return "e.g., 90";
      return "Enter value";
    default:
      return "Enter value";
  }
};

/**
 * Get current value as string for display
 */
export const getValueString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";

  if (value.value.unit === "range") {
    return "";
  }

  return String(value.value.value || "");
};

/**
 * Get range min value as string
 */
export const getRangeMinString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return String(value.value.min || "");
};

/**
 * Get range max value as string
 */
export const getRangeMaxString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return String(value.value.max || "");
};
