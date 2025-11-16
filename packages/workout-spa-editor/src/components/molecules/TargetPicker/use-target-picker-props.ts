import { getUnitOptions, getValueLabel, getValuePlaceholder } from "./helpers";
import type { TargetPickerState } from "./useTargetPickerState";

export function useTargetPickerProps(state: TargetPickerState, error?: string) {
  const displayError = error || state.validationError;
  const unitOptions = getUnitOptions(state.targetType) || [];

  return {
    targetType: state.targetType,
    unit: state.unit,
    targetValue: state.targetValue,
    minValue: state.minValue,
    maxValue: state.maxValue,
    displayError,
    unitOptions,
    getValueLabel,
    getValuePlaceholder,
  };
}
