import { TargetPickerFields } from "./TargetPickerFields";
import { useTargetPickerProps } from "./use-target-picker-props";
import { useTargetPickerHandlers } from "./useTargetPickerHandlers";
import { useTargetPickerState } from "./useTargetPickerState";
import { useProfileStore } from "../../../store/profile-store";
import type { TargetPickerProps } from "./TargetPicker.types";

export const TargetPicker = ({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: TargetPickerProps) => {
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfile = activeProfileId
    ? (profiles.find((p) => p.id === activeProfileId) ?? null)
    : null;

  const state = useTargetPickerState(value);
  const handlers = useTargetPickerHandlers({
    ...state,
    onChange,
  });
  const props = useTargetPickerProps(state, error, activeProfile);

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
