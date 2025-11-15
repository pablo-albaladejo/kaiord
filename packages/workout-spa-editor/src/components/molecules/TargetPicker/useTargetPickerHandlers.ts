import type { Target } from "../../../types/krd";
import {
  useRangeChange,
  useTypeChange,
  useUnitChange,
  useValueChange,
} from "./hooks";
import { useTargetPickerRangeHandlers } from "./useTargetPickerRangeHandlers";

type UseTargetPickerHandlersParams = {
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

export const useTargetPickerHandlers = ({
  targetType,
  unit,
  maxValue,
  minValue,
  onChange,
  setTargetType,
  setValidationError,
  setUnit,
  setTargetValue,
  setMinValue,
  setMaxValue,
}: UseTargetPickerHandlersParams) => {
  const handleTypeChange = useTypeChange(
    onChange,
    setTargetType,
    setValidationError,
    setUnit,
    setTargetValue,
    setMinValue,
    setMaxValue
  );

  const handleUnitChange = useUnitChange(
    onChange,
    setUnit,
    setValidationError,
    setTargetValue,
    setMinValue,
    setMaxValue
  );

  const handleValueChange = useValueChange(
    targetType,
    unit,
    onChange,
    setTargetValue,
    setValidationError
  );

  const handleRangeChange = useRangeChange(
    targetType,
    unit,
    onChange,
    setValidationError
  );

  const rangeHandlers = useTargetPickerRangeHandlers(
    minValue,
    maxValue,
    setMinValue,
    setMaxValue,
    handleRangeChange
  );

  return {
    handleTypeChange,
    handleUnitChange,
    handleValueChange,
    handleMinChange: rangeHandlers.handleMinChange,
    handleMaxChange: rangeHandlers.handleMaxChange,
  };
};
