import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { ValidationResult } from "./validation-types";

export function validatePowerZone(
  value: number,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  if (!Number.isInteger(value) || value < 1 || value > 7) {
    return {
      isValid: false,
      error: t("validation.powerZoneRange"),
    };
  }
  return null;
}

export function validatePowerWatts(
  value: number,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  if (value > 2000) {
    return {
      isValid: false,
      error: t("validation.powerMaxWatts"),
    };
  }
  return null;
}

export function validatePowerPercent(
  value: number,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  if (value > 200) {
    return {
      isValid: false,
      error: t("validation.percentMax200"),
    };
  }
  return null;
}
