import type { Profile } from "../../../types/profile";
import { getUnitOptions, getValueLabel, getValuePlaceholder } from "./helpers";
import type { TargetPickerState } from "./useTargetPickerState";

export function useTargetPickerProps(
  state: TargetPickerState,
  error?: string,
  activeProfile?: Profile | null
) {
  const displayError = error || state.validationError;
  const unitOptions = getUnitOptions(state.targetType, activeProfile) || [];

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
    activeProfile,
  };
}
