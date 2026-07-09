import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { ValidationResult } from "./validation-types";

export function validateValueString(
  value: string,
  t: Translate = getTranslate("targets")
): ValidationResult | null {
  const valueStr = String(value || "");

  if (!valueStr || valueStr.trim() === "") {
    return {
      isValid: false,
      error: t("validation.valueRequired"),
    };
  }

  const numericValue = Number(valueStr);

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: t("validation.mustBeValidNumber"),
    };
  }

  if (numericValue <= 0) {
    return {
      isValid: false,
      error: t("validation.mustBeGreaterThanZero"),
    };
  }

  return null;
}
