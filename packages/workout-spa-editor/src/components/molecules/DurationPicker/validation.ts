import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { Duration } from "../../../types/krd";
import {
  validateClockDuration,
  validateDistanceDuration,
} from "./validation-helpers";

export type ValidationResult = {
  isValid: boolean;
  error?: string;
  duration?: Duration;
};

export const validateDurationValue = (
  type: "time" | "distance" | "open",
  value: string,
  t: Translate = getTranslate("editor")
): ValidationResult => {
  if (type === "open") return { isValid: true, duration: { type: "open" } };
  if (type === "time") return validateClockDuration(value, t);
  return validateDistanceDuration(value, t);
};
