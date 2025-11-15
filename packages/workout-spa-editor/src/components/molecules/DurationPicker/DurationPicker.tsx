import { useState } from "react";
import { Input } from "../../atoms/Input/Input";
import type {
  DurationPickerProps,
  DurationTypeOption,
} from "./DurationPicker.types";
import {
  getDurationTypeFromValue,
  getDurationValueString,
  getValueLabel,
  getValuePlaceholder,
} from "./helpers";
import { useTypeChange, useValueChange } from "./hooks";

const DURATION_TYPE_OPTIONS: Array<DurationTypeOption> = [
  { value: "time", label: "Time" },
  { value: "distance", label: "Distance" },
  { value: "open", label: "Open" },
];

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
      <Input
        variant="select"
        label="Duration Type"
        value={durationType}
        onChange={handleTypeChange}
        disabled={disabled}
        options={DURATION_TYPE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        aria-label="Select duration type"
      />

      {durationType !== "open" && (
        <Input
          variant="number"
          label={getValueLabel(durationType)}
          value={durationValue}
          onChange={handleValueChange}
          disabled={disabled}
          error={displayError}
          placeholder={getValuePlaceholder(durationType)}
          min="0"
          step={durationType === "time" ? "1" : "0.01"}
          aria-label={getValueLabel(durationType)}
          aria-invalid={Boolean(displayError)}
          aria-describedby={displayError ? "duration-error" : undefined}
        />
      )}

      {durationType === "open" && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Open-ended duration (manual lap button)
        </p>
      )}
    </div>
  );
};
