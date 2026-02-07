import { useState } from "react";
import { DurationPickerFields } from "./DurationPickerFields";
import {
  getDurationTypeFromValue,
  getDurationValueString,
  getValueLabel,
  getValuePlaceholder,
} from "./helpers";
import { useTypeChange, useValueChange } from "./hooks";
import type { DurationPickerProps } from "./DurationPicker.types";

export const DurationPicker = ({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: DurationPickerProps) => {
  const [durationType, setDurationType] = useState<
    "time" | "distance" | "open"
  >(getDurationTypeFromValue(value));
  const [durationValue, setDurationValue] = useState<string>(
    getDurationValueString(value)
  );
  const [validationError, setValidationError] = useState<string>("");

  const handleTypeChange = useTypeChange(
    onChange,
    setDurationType,
    setValidationError,
    setDurationValue
  );

  const handleValueChange = useValueChange(
    durationType,
    onChange,
    setDurationValue,
    setValidationError
  );

  const displayError = error || validationError;

  return (
    <div className={`space-y-4 ${className}`}>
      <DurationPickerFields
        durationType={durationType}
        durationValue={durationValue}
        displayError={displayError}
        disabled={disabled}
        onTypeChange={handleTypeChange}
        onValueChange={handleValueChange}
        getValueLabel={getValueLabel}
        getValuePlaceholder={getValuePlaceholder}
      />
    </div>
  );
};
