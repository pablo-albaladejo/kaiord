import type { ValidationResult } from "./validation-types";

export function validateValueString(value: string): ValidationResult | null {
  const valueStr = String(value || "");

  if (!valueStr || valueStr.trim() === "") {
    return {
      isValid: false,
      error: "Value is required",
    };
  }

  const numericValue = Number(valueStr);

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: "Must be a valid number",
    };
  }

  if (numericValue <= 0) {
    return {
      isValid: false,
      error: "Must be greater than 0",
    };
  }

  return null;
}
