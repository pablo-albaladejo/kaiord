import type { Translate } from "../../../i18n/use-translate";
import { parseClock } from "../../../lib/units/clock";
import type { ValidationResult } from "./validation";

const MAX_SECONDS = 86400;
const MAX_METERS = 1000000;

const invalid = (error: string): ValidationResult => ({
  isValid: false,
  error,
});

/** A time typed as m:ss (or h:mm:ss, or bare minutes), kept in seconds. */
export const validateClockDuration = (
  value: string,
  t: Translate
): ValidationResult => {
  if (value.trim() === "") return invalid(t("durationPicker.required"));
  const seconds = parseClock(value);
  if (seconds === null) return invalid(t("durationPicker.invalidClock"));
  if (seconds <= 0) return invalid(t("durationPicker.positive"));
  if (seconds > MAX_SECONDS) return invalid(t("durationPicker.maxTime"));
  return { isValid: true, duration: { type: "time", seconds } };
};

export const validateDistanceDuration = (
  value: string,
  t: Translate
): ValidationResult => {
  if (value.trim() === "") return invalid(t("durationPicker.required"));
  const meters = Number(value);
  if (Number.isNaN(meters)) return invalid(t("durationPicker.invalidNumber"));
  if (meters <= 0) return invalid(t("durationPicker.positive"));
  if (meters > MAX_METERS) return invalid(t("durationPicker.maxDistance"));
  return { isValid: true, duration: { type: "distance", meters } };
};
