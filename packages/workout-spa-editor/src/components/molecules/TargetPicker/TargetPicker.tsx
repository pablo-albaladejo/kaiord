import { useUnits } from "../../../contexts/units-context";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { paceInputBase } from "../../../lib/units/pace-input";
import { useCurrentWorkout } from "../../../store/selectors";
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
  // Live join of `meta.activeProfileId` and `profiles.get(id)` (D1).
  // `undefined` while loading collapses to `null` so downstream
  // selection rendering matches legacy "no active profile" behavior.
  const activeProfile = useActiveProfileLive()?.profile ?? null;

  // Pace is typed per km (per 100 m in the pool), in the user's units.
  const sport = useCurrentWorkout()?.metadata.sport;
  const state = useTargetPickerState(value, paceInputBase(sport, useUnits()));
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
