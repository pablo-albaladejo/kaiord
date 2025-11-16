import { useState } from "react";
import type { Target } from "../../../types/krd";
import {
  getCurrentUnit,
  getRangeMaxString,
  getRangeMinString,
  getTargetTypeFromValue,
  getValueString,
} from "./helpers";

export const useTargetPickerState = (value: Target | null) => {
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
