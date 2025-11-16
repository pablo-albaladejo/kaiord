import type { Target } from "../../../types/krd";

export type UseTargetPickerHandlersParams = {
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open";
  unit: string;
  maxValue: string;
  minValue: string;
  onChange: (target: Target | null) => void;
  setTargetType: (
    type: "power" | "heart_rate" | "pace" | "cadence" | "open"
  ) => void;
  setValidationError: (error: string) => void;
  setUnit: (unit: string) => void;
  setTargetValue: (value: string) => void;
  setMinValue: (value: string) => void;
  setMaxValue: (value: string) => void;
};
