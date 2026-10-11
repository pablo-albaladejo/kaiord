import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { Units } from "../../../lib/units/units";
import type { WorkoutStep } from "../../../types/krd";
import {
  formatCadenceTarget,
  formatHeartRateTarget,
  formatPaceTarget,
  formatPowerTarget,
} from "./format-target-units";

export {
  formatCadenceTarget,
  formatHeartRateTarget,
  formatPaceTarget,
  formatPowerTarget,
};

const TARGET_KEYS: Record<string, string> = {
  power: "target.power",
  heart_rate: "target.heartRate",
  cadence: "target.cadence",
  pace: "target.pace",
  open: "target.open",
};

/** The localized name of a target type, e.g. "heart_rate" → "Heart rate". */
export const targetTypeLabel = (
  targetType: string,
  t: Translate = getTranslate("editor")
): string => {
  const key = TARGET_KEYS[targetType];
  return key ? t(key) : targetType.replace(/_/g, " ");
};

/** Top-level target formatter used by StepCard. */
export const formatTarget = (
  step: WorkoutStep,
  units: Units = "metric",
  t: Translate = getTranslate("editor")
): string => {
  const { target, targetType } = step;
  if (targetType === "open") return t("target.open");
  if (!("value" in target)) return targetTypeLabel(targetType, t);
  const value = target.value;
  switch (targetType) {
    case "power":
      return formatPowerTarget(value, t);
    case "heart_rate":
      return formatHeartRateTarget(value, t);
    case "cadence":
      return formatCadenceTarget(value, t);
    case "pace":
      return formatPaceTarget(value, units, t);
    default:
      return targetTypeLabel(targetType, t);
  }
};
