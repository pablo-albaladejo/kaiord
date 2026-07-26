import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { getUnitOptions, getValueLabel, getValuePlaceholder } from "./helpers";
import type { TargetPickerState } from "./useTargetPickerState";

export function useTargetPickerProps(
  state: TargetPickerState,
  error?: string,
  activeProfile?: Profile | null
) {
  const t = useTranslate("targets");
  const displayError = error || state.validationError;
  const unitOptions = getUnitOptions(state.targetType, activeProfile, t) || [];

  return {
    targetType: state.targetType,
    unit: state.unit,
    targetValue: state.targetValue,
    minValue: state.minValue,
    maxValue: state.maxValue,
    displayError,
    unitOptions,
    getValueLabel: (
      type: "power" | "heart_rate" | "pace" | "cadence" | "open",
      unit: string
    ) => getValueLabel(type, unit, t),
    getValuePlaceholder: (
      type: "power" | "heart_rate" | "pace" | "cadence" | "open",
      unit: string
    ) => getValuePlaceholder(type, unit, t),
    activeProfile,
  };
}
