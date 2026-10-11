import { useCallback } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { PaceInputBase } from "../../../lib/units/pace-input";
import type { Target } from "../../../types/krd";
import { validateTargetValue } from "./validation";

export const useValueChange = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  onChange: (target: Target | null) => void,
  setValue: (value: string) => void,
  setValidationError: (error: string) => void,
  paceBase?: PaceInputBase
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
        t,
        paceBase
      );

      if (result.isValid && result.target) {
        setValidationError("");
        onChange(result.target);
      } else {
        setValidationError(result.error || "");
        onChange(null);
      }
    },
    [targetType, unit, onChange, setValue, setValidationError, t, paceBase]
  );
};

export const useRangeChange = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  onChange: (target: Target | null) => void,
  setValidationError: (error: string) => void,
  paceBase?: PaceInputBase
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
        t,
        paceBase
      );

      if (result.isValid && result.target) {
        setValidationError("");
        onChange(result.target);
      } else {
        setValidationError(result.error || "");
        onChange(null);
      }
    },
    [targetType, unit, onChange, setValidationError, t, paceBase]
  );
};
