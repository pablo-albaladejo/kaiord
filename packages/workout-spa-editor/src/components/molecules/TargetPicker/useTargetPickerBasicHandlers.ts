import { useTypeChange, useUnitChange, useValueChange } from "./hooks";
import type { BasicHandlersParams } from "./useTargetPickerBasicHandlers.types";

export function useTargetPickerBasicHandlers(params: BasicHandlersParams) {
  const handleTypeChange = useTypeChange(
    params.onChange,
    params.setTargetType,
    params.setValidationError,
    params.setUnit,
    params.setTargetValue,
    params.setMinValue,
    params.setMaxValue
  );

  const handleUnitChange = useUnitChange(
    params.onChange,
    params.setUnit,
    params.setValidationError,
    params.setTargetValue,
    params.setMinValue,
    params.setMaxValue
  );

  const handleValueChange = useValueChange(
    params.targetType,
    params.unit,
    params.onChange,
    params.setTargetValue,
    params.setValidationError
  );

  return {
    handleTypeChange,
    handleUnitChange,
    handleValueChange,
  };
}
