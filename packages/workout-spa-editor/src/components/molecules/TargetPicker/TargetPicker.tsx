import { getUnitOptions, getValueLabel, getValuePlaceholder } from "./helpers";
import type { TargetPickerProps } from "./TargetPicker.types";
import { TargetPickerFields } from "./TargetPickerFields";
import { useTargetPickerHandlers } from "./useTargetPickerHandlers";
import { useTargetPickerState } from "./useTargetPickerState";

export const TargetPicker = ({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: TargetPickerProps) => {
  const state = useTargetPickerState(value);

  const handlers = useTargetPickerHandlers({
    targetType: state.targetType,
    unit: state.unit,
    maxValue: state.maxValue,
    minValue: state.minValue,
    onChange,
    setTargetType: state.setTargetType,
    setValidationError: state.setValidationError,
    setUnit: state.setUnit,
    setTargetValue: state.setTargetValue,
    setMinValue: state.setMinValue,
    setMaxValue: state.setMaxValue,
  });

  const displayError = error || state.validationError;
  const unitOptions = getUnitOptions(state.targetType) || [];

  return (
    <div className={`space-y-4 ${className}`}>
      <TargetPickerFields
        targetType={state.targetType}
        unit={state.unit}
        targetValue={state.targetValue}
        minValue={state.minValue}
        maxValue={state.maxValue}
        displayError={displayError}
        disabled={disabled}
        unitOptions={unitOptions}
        onTypeChange={handlers.handleTypeChange}
        onUnitChange={handlers.handleUnitChange}
        onValueChange={handlers.handleValueChange}
        onMinChange={handlers.handleMinChange}
        onMaxChange={handlers.handleMaxChange}
        getValueLabel={getValueLabel}
        getValuePlaceholder={getValuePlaceholder}
      />
    </div>
  );
};
