import { useRangeChange } from "./hooks";
import { useTargetPickerBasicHandlers } from "./useTargetPickerBasicHandlers";
import type { UseTargetPickerHandlersParams } from "./useTargetPickerHandlers.types";
import { useTargetPickerRangeHandlers } from "./useTargetPickerRangeHandlers";

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
