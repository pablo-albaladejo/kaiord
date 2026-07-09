import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { ValidationResult } from "./validation-types";

export function validateRangeStrings(
  minValue?: string,
  maxValue?: string,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  const minStr = String(minValue || "");
  const maxStr = String(maxValue || "");

  if (!minStr || minStr.trim() === "") {
    return {
      isValid: false,
      error: t("validation.minRequired"),
    };
  }

  if (!maxStr || maxStr.trim() === "") {
    return {
      isValid: false,
      error: t("validation.maxRequired"),
    };
  }

  return null;
}

export function validateRangeNumbers(
  min: number,
  max: number,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  if (isNaN(min) || isNaN(max)) {
    return {
      isValid: false,
      error: t("validation.valuesMustBeValidNumbers"),
    };
  }

  if (min <= 0 || max <= 0) {
    return {
      isValid: false,
      error: t("validation.valuesMustBeGreaterThanZero"),
    };
  }

  if (min >= max) {
    return {
      isValid: false,
      error: t("validation.minLessThanMax"),
    };
  }

  return null;
}
