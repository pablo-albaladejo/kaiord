import type { Target } from "../../../types/krd";
import {
  useRangeChange,
  useTypeChange,
  useUnitChange,
  useValueChange,
} from "./hooks";

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

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = e.target.value;
    setMinValue(newMin);
    handleRangeChange(newMin, maxValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = e.target.value;
    setMaxValue(newMax);
    handleRangeChange(minValue, newMax);
  };

  return {
    handleTypeChange,
    handleUnitChange,
    handleValueChange,
    handleMinChange,
    handleMaxChange,
  };
};
