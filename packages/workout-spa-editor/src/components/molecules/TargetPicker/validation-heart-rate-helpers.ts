import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { ValidationResult } from "./validation-types";

export function validateHeartRateZone(
  value: number,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return {
      isValid: false,
      error: t("validation.heartRateZoneRange"),
    };
  }
  return null;
}

export function validateHeartRateBpm(
  value: number,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  if (value > 250) {
    return {
      isValid: false,
      error: t("validation.heartRateMaxBpm"),
    };
  }
  return null;
}

export function validateHeartRatePercent(
  value: number,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  if (value > 100) {
    return {
      isValid: false,
      error: t("validation.percentMax100"),
    };
  }
  return null;
}
