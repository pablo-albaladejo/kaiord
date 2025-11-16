import {
  useRangeChange,
  useTypeChange,
  useUnitChange,
  useValueChange,
} from "./hooks";
import type { UseTargetPickerHandlersParams } from "./useTargetPickerHandlers.types";
import { useTargetPickerRangeHandlers } from "./useTargetPickerRangeHandlers";

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
