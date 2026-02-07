import { useRangeChange } from "./hooks";
import { useTargetPickerBasicHandlers } from "./useTargetPickerBasicHandlers";
import { useTargetPickerRangeHandlers } from "./useTargetPickerRangeHandlers";
import type { UseTargetPickerHandlersParams } from "./useTargetPickerHandlers.types";

export const useTargetPickerHandlers = (
  params: UseTargetPickerHandlersParams
) => {
  const basicHandlers = useTargetPickerBasicHandlers(params);

  const handleRangeChange = useRangeChange(
    params.targetType,
    params.unit,
    params.onChange,
    params.setValidationError
  );

  const rangeHandlers = useTargetPickerRangeHandlers(
    params.minValue,
    params.maxValue,
    params.setMinValue,
    params.setMaxValue,
    handleRangeChange
  );

  return {
    ...basicHandlers,
    handleMinChange: rangeHandlers.handleMinChange,
    handleMaxChange: rangeHandlers.handleMaxChange,
  };
};
