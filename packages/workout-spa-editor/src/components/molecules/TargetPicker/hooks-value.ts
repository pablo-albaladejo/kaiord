import { useCallback } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { Target } from "../../../types/krd";
import { validateTargetValue } from "./validation";

export const useValueChange = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  onChange: (target: Target | null) => void,
  setValue: (value: string) => void,
  setValidationError: (error: string) => void
) => {
  const t = useTranslate("targets");

  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      const result = validateTargetValue(
        targetType,
        unit,
        newValue,
        undefined,
        undefined,
        t
      );

      if (result.isValid && result.target) {
        setValidationError("");
        onChange(result.target);
      } else {
        setValidationError(result.error || "");
        onChange(null);
      }
    },
    [targetType, unit, onChange, setValue, setValidationError, t]
  );
};

export const useRangeChange = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  onChange: (target: Target | null) => void,
  setValidationError: (error: string) => void
) => {
  const t = useTranslate("targets");

  return useCallback(
    (minValue: string, maxValue: string) => {
      const result = validateTargetValue(
        targetType,
        unit,
        "",
        minValue,
        maxValue,
        t
      );

      if (result.isValid && result.target) {
        setValidationError("");
        onChange(result.target);
      } else {
        setValidationError(result.error || "");
        onChange(null);
      }
    },
    [targetType, unit, onChange, setValidationError, t]
  );
};
