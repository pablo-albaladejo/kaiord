import { useCallback } from "react";
import type { Target } from "../../../types/krd";
import { validateTargetValue } from "./validation";

/**
 * Hook for handling target type changes
 */
export const useTypeChange = (
  onChange: (target: Target | null) => void,
  setTargetType: (
    type: "power" | "heart_rate" | "pace" | "cadence" | "open"
  ) => void,
  setValidationError: (error: string) => void,
  setUnit: (unit: string) => void,
  setValue: (value: string) => void,
  setMinValue: (value: string) => void,
  setMaxValue: (value: string) => void
) => {
  return useCallback(
    (newType: string) => {
      const type = newType as
        | "power"
        | "heart_rate"
        | "pace"
        | "cadence"
        | "open";
      setTargetType(type);
      setValidationError("");
      setValue("");
      setMinValue("");
      setMaxValue("");

      if (type === "open") {
        setUnit("");
        onChange({ type: "open" });
      } else {
        // Set default unit for each type
        const defaultUnit =
          type === "power"
            ? "watts"
            : type === "heart_rate"
              ? "bpm"
              : type === "pace"
                ? "mps"
                : "rpm";
        setUnit(defaultUnit);
        onChange(null);
      }
    },
    [
      onChange,
      setTargetType,
      setValidationError,
      setUnit,
      setValue,
      setMinValue,
      setMaxValue,
    ]
  );
};

/**
 * Hook for handling unit changes
 */
export const useUnitChange = (
  onChange: (target: Target | null) => void,
  setUnit: (unit: string) => void,
  setValidationError: (error: string) => void,
  setValue: (value: string) => void,
  setMinValue: (value: string) => void,
  setMaxValue: (value: string) => void
) => {
  return useCallback(
    (newUnit: string) => {
      setUnit(newUnit);
      setValidationError("");
      setValue("");
      setMinValue("");
      setMaxValue("");
      onChange(null);
    },
    [onChange, setUnit, setValidationError, setValue, setMinValue, setMaxValue]
  );
};

/**
 * Hook for handling value changes (single value)
 */
export const useValueChange = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  onChange: (target: Target | null) => void,
  setValue: (value: string) => void,
  setValidationError: (error: string) => void
) => {
  return useCallback(
    (newValue: string) => {
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

/**
 * Hook for handling range value changes
 */
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
