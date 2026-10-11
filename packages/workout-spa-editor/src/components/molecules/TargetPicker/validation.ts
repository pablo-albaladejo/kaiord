import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { PaceInputBase } from "../../../lib/units/pace-input";
import { validateHeartRateTarget } from "./validation-heart-rate";
import { validateValueString } from "./validation-helpers";
import {
  validateCadenceTarget,
  validatePaceTarget,
} from "./validation-pace-cadence";
import {
  validatePaceClock,
  validatePaceClockRange,
} from "./validation-pace-clock";
import { validatePowerTarget } from "./validation-power";
import { validateRangeInput } from "./validation-range";
import type { ValidationResult } from "./validation-types";

export type { ValidationResult } from "./validation-types";

export const validateTargetValue = (
  type: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  value: string,
  minValue?: string,
  maxValue?: string,
  t: Translate = getTranslate("targets"),
  paceBase?: PaceInputBase
): ValidationResult => {
  if (type === "open") {
    return {
      isValid: true,
      target: { type: "open" },
    };
  }

  // Pace is typed as m:ss in the athlete's base, never as raw m/s.
  if (type === "pace" && paceBase && unit === "mps")
    return validatePaceClock(value, paceBase, t);
  if (type === "pace" && paceBase && unit === "range")
    return validatePaceClockRange(minValue, maxValue, paceBase, t);

  if (unit === "range") {
    return validateRangeInput(type, minValue, maxValue, t);
  }

  const valueError = validateValueString(value, t);
  if (valueError) return valueError;

  const numericValue = Number(value);

  if (type === "power") return validatePowerTarget(unit, numericValue, t);
  if (type === "heart_rate")
    return validateHeartRateTarget(unit, numericValue, t);
  if (type === "pace") return validatePaceTarget(unit, numericValue, t);
  if (type === "cadence") return validateCadenceTarget(unit, numericValue, t);

  return {
    isValid: false,
    error: t("validation.invalidTargetType"),
  };
};
