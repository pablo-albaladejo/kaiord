/**
 * Pace typed as m:ss per km / mile / 100 m, stored as m/s. A faster pace is
 * a higher speed, so a range is ordered by speed whichever end was typed
 * first.
 */
import type { Translate } from "../../../i18n/use-translate";
import { parseClock } from "../../../lib/units/clock";
import {
  type PaceInputBase,
  paceSecondsToMps,
} from "../../../lib/units/pace-input";
import type { ValidationResult } from "./validation-types";

const toMps = (text: string | undefined, base: PaceInputBase) => {
  const seconds = parseClock(text ?? "");
  return seconds && seconds > 0 ? paceSecondsToMps(seconds, base) : null;
};

const invalid = (error: string): ValidationResult => ({
  isValid: false,
  error,
});

export const validatePaceClock = (
  value: string,
  base: PaceInputBase,
  t: Translate
): ValidationResult => {
  if (value.trim() === "") return invalid(t("validation.valueRequired"));
  const mps = toMps(value, base);
  if (mps === null) return invalid(t("validation.paceClock"));
  return {
    isValid: true,
    target: { type: "pace", value: { unit: "mps", value: mps } },
  };
};

export const validatePaceClockRange = (
  minValue: string | undefined,
  maxValue: string | undefined,
  base: PaceInputBase,
  t: Translate
): ValidationResult => {
  if (!minValue?.trim()) return invalid(t("validation.minRequired"));
  if (!maxValue?.trim()) return invalid(t("validation.maxRequired"));
  const a = toMps(minValue, base);
  const b = toMps(maxValue, base);
  if (a === null || b === null) return invalid(t("validation.paceClock"));
  const value = {
    unit: "range" as const,
    min: Math.min(a, b),
    max: Math.max(a, b),
  };
  return { isValid: true, target: { type: "pace", value } };
};
