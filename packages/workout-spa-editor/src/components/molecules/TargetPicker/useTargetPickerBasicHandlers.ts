import { useTypeChange, useUnitChange, useValueChange } from "./hooks";
import type { UseTargetPickerHandlersParams } from "./useTargetPickerHandlers.types";

export function useTargetPickerBasicHandlers({
  targetType,
  unit,
  onChange,
  setTargetType,
  setValidationError,
  setUnit,
  setTargetValue,
  setMinValue,
  setMaxValue,
}: Pick<
  UseTargetPickerHandlersParams,
  | "targetType"
  | "unit"
  | "onChange"
  | "setTargetType"
  | "setValidationError"
  | "setUnit"
  | "setTargetValue"
  | "setMinValue"
  | "setMaxValue"
>) {
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

  return {
    handleTypeChange,
    handleUnitChange,
    handleValueChange,
  };
}
