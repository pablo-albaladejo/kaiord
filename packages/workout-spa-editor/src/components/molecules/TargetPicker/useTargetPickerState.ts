import { useState } from "react";
import {
  getCurrentUnit,
  getRangeMaxString,
  getRangeMinString,
  getTargetTypeFromValue,
  getValueString,
} from "./helpers";
import type { Target } from "../../../types/krd";

export type TargetPickerState = {
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open";
  setTargetType: (
    value: "power" | "heart_rate" | "pace" | "cadence" | "open"
  ) => void;
  unit: string;
  setUnit: (value: string) => void;
  targetValue: string;
  setTargetValue: (value: string) => void;
  minValue: string;
  setMinValue: (value: string) => void;
  maxValue: string;
  setMaxValue: (value: string) => void;
  validationError: string;
  setValidationError: (value: string) => void;
};

export const useTargetPickerState = (
  value: Target | null
): TargetPickerState => {
  const [targetType, setTargetType] = useState<
    "power" | "heart_rate" | "pace" | "cadence" | "open"
  >(getTargetTypeFromValue(value));
  const [unit, setUnit] = useState<string>(getCurrentUnit(value));
  const [targetValue, setTargetValue] = useState<string>(getValueString(value));
  const [minValue, setMinValue] = useState<string>(getRangeMinString(value));
  const [maxValue, setMaxValue] = useState<string>(getRangeMaxString(value));
  const [validationError, setValidationError] = useState<string>("");

  return {
    targetType,
    setTargetType,
    unit,
    setUnit,
    targetValue,
    setTargetValue,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    validationError,
    setValidationError,
  };
};
