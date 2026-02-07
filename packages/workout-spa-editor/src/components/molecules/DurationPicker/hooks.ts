import { useCallback } from "react";
import { validateDurationValue } from "./validation";
import type { Duration } from "../../../types/krd";

export const useTypeChange = (
  onChange: (duration: Duration | null) => void,
  setDurationType: (type: "time" | "distance" | "open") => void,
  setValidationError: (error: string) => void,
  setDurationValue: (value: string) => void
) => {
  return useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as "time" | "distance" | "open";
      setDurationType(newType);
      setValidationError("");

      if (newType === "open") {
        onChange({ type: "open" });
        setDurationValue("");
      } else {
        setDurationValue("");
        onChange(null);
      }
    },
    [onChange, setDurationType, setValidationError, setDurationValue]
  );
};

export const useValueChange = (
  durationType: "time" | "distance" | "open",
  onChange: (duration: Duration | null) => void,
  setDurationValue: (value: string) => void,
  setValidationError: (error: string) => void
) => {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setDurationValue(newValue);

      const validation = validateDurationValue(durationType, newValue);

      if (validation.isValid && validation.duration) {
        setValidationError("");
        onChange(validation.duration);
      } else {
        setValidationError(validation.error || "");
        onChange(null);
      }
    },
    [durationType, onChange, setDurationValue, setValidationError]
  );
};
