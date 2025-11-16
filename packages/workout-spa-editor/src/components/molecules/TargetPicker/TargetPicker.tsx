import type { TargetPickerProps } from "./TargetPicker.types";
import { TargetPickerFields } from "./TargetPickerFields";
import { useTargetPickerProps } from "./use-target-picker-props";
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
    ...state,
    onChange,
  });
  const props = useTargetPickerProps(state, error);

  return (
    <div className={`space-y-4 ${className}`}>
      <TargetPickerFields
        {...props}
        disabled={disabled}
        onTypeChange={handlers.handleTypeChange}
        onUnitChange={handlers.handleUnitChange}
        onValueChange={handlers.handleValueChange}
        onMinChange={handlers.handleMinChange}
        onMaxChange={handlers.handleMaxChange}
      />
    </div>
  );
};
