import { useCallback } from "react";
import type { Target } from "../../../types/krd";

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
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const type = e.target.value as
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

export const useUnitChange = (
  onChange: (target: Target | null) => void,
  setUnit: (unit: string) => void,
  setValidationError: (error: string) => void,
  setValue: (value: string) => void,
  setMinValue: (value: string) => void,
  setMaxValue: (value: string) => void
) => {
  return useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newUnit = e.target.value;
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
