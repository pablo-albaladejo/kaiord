import { useCallback } from "react";
import { validateTargetValue } from "./validation";
import type { Target } from "../../../types/krd";

export const useValueChange = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  onChange: (target: Target | null) => void,
  setValue: (value: string) => void,
  setValidationError: (error: string) => void
) => {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      const result = validateTargetValue(targetType, unit, newValue);

      if (result.isValid && result.target) {
        setValidationError("");
        onChange(result.target);
      } else {
        setValidationError(result.error || "");
        onChange(null);
      }
    },
    [targetType, unit, onChange, setValue, setValidationError]
  );
};

export const useRangeChange = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  onChange: (target: Target | null) => void,
  setValidationError: (error: string) => void
) => {
  return useCallback(
    (minValue: string, maxValue: string) => {
      const result = validateTargetValue(
        targetType,
        unit,
        "",
        minValue,
        maxValue
      );

      if (result.isValid && result.target) {
        setValidationError("");
        onChange(result.target);
      } else {
        setValidationError(result.error || "");
        onChange(null);
      }
    },
    [targetType, unit, onChange, setValidationError]
  );
};
