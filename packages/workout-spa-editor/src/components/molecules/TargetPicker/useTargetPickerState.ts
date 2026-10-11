import { useState } from "react";

import type { PaceInputBase } from "../../../lib/units/pace-input";
import type { Target } from "../../../types/krd";
import {
  getCurrentUnit,
  getRangeMaxString,
  getRangeMinString,
  getTargetTypeFromValue,
  getValueString,
} from "./helpers";

export type TargetPickerState = {
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open";
  setTargetType: (
    value: "power" | "heart_rate" | "pace" | "cadence" | "open"
  ) => void;
  unit: string;
  setUnit: (value: string) => void;
  paceBase?: PaceInputBase;
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
  value: Target | null,
  paceBase?: PaceInputBase
): TargetPickerState => {
  const [targetType, setTargetType] = useState<
    "power" | "heart_rate" | "pace" | "cadence" | "open"
  >(getTargetTypeFromValue(value));
  const [unit, setUnit] = useState<string>(getCurrentUnit(value));
  const [targetValue, setTargetValue] = useState<string>(
    getValueString(value, paceBase)
  );
  const [minValue, setMinValue] = useState<string>(
    getRangeMinString(value, paceBase)
  );
  const [maxValue, setMaxValue] = useState<string>(
    getRangeMaxString(value, paceBase)
  );
  const [validationError, setValidationError] = useState<string>("");

  return {
    targetType,
    setTargetType,
    unit,
    setUnit,
    paceBase,
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
