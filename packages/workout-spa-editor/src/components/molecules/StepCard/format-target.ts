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

/** Top-level target formatter used by StepCard. */
export const formatTarget = (
  step: WorkoutStep,
  units: Units = "metric",
  t: Translate = getTranslate("editor")
): string => {
  const { target, targetType } = step;
  if (targetType === "open") return t("target.open");
  if (!("value" in target)) return targetType.replace(/_/g, " ");
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
      return targetType.replace(/_/g, " ");
  }
};
