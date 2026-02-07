import { getValueLabel, isRepeatType } from "./advanced/duration-helpers";
import { DurationTypeSelect } from "./advanced/DurationTypeSelect";
import { DurationValueInput } from "./advanced/DurationValueInput";
import { RepeatFromInput } from "./advanced/RepeatFromInput";
import { useAdvancedDuration } from "./advanced/useAdvancedDuration";
import type { Duration } from "../../../types/krd";

export type AdvancedDurationPickerProps = {
  value: Duration | null;
  onChange: (duration: Duration | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export const AdvancedDurationPicker = ({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: AdvancedDurationPickerProps) => {
  const {
    durationType,
    durationValue,
    repeatFrom,
    validationError,
    handleTypeChange,
    handleValueChange,
    handleRepeatFromChange,
  } = useAdvancedDuration(value, onChange);

  const displayError = error || validationError;

  return (
    <div className={`space-y-4 ${className}`}>
      <DurationTypeSelect
        value={durationType}
        onChange={handleTypeChange}
        disabled={disabled}
      />

      <DurationValueInput
        durationType={durationType}
        value={durationValue}
        label={getValueLabel(durationType)}
        onChange={handleValueChange}
        disabled={disabled}
      />

      {isRepeatType(durationType) && (
        <RepeatFromInput
          value={repeatFrom}
          onChange={handleRepeatFromChange}
          disabled={disabled}
        />
      )}

      {displayError && (
        <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
      )}
    </div>
  );
};
