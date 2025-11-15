import { useState } from "react";
import { Input } from "../../atoms/Input/Input";
import type { TargetPickerProps, TargetTypeOption } from "./TargetPicker.types";
import {
  getCurrentUnit,
  getRangeMaxString,
  getRangeMinString,
  getTargetTypeFromValue,
  getUnitOptions,
  getValueLabel,
  getValuePlaceholder,
  getValueString,
} from "./helpers";
import {
  useRangeChange,
  useTypeChange,
  useUnitChange,
  useValueChange,
} from "./hooks";

const TARGET_TYPE_OPTIONS: Array<TargetTypeOption> = [
  { value: "power", label: "Power" },
  { value: "heart_rate", label: "Heart Rate" },
  { value: "pace", label: "Pace" },
  { value: "cadence", label: "Cadence" },
  { value: "open", label: "Open" },
];

export const TargetPicker = ({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: TargetPickerProps) => {
  const [targetType, setTargetType] = useState<
    "power" | "heart_rate" | "pace" | "cadence" | "open"
  >(getTargetTypeFromValue(value));
  const [unit, setUnit] = useState<string>(getCurrentUnit(value));
  const [targetValue, setTargetValue] = useState<string>(getValueString(value));
  const [minValue, setMinValue] = useState<string>(getRangeMinString(value));
  const [maxValue, setMaxValue] = useState<string>(getRangeMaxString(value));
  const [validationError, setValidationError] = useState<string>("");

  const handleTypeChange = useTypeChange(
    onChange,
    setTargetType,
    setValidationError,
    setUnit,
    setTargetValue,
    setMinValue,
    setMaxValue
  );

  const handleUnitChange = useUnitChange(
    onChange,
    setUnit,
    setValidationError,
    setTargetValue,
    setMinValue,
    setMaxValue
  );

  const handleValueChange = useValueChange(
    targetType,
    unit,
    onChange,
    setTargetValue,
    setValidationError
  );

  const handleRangeChange = useRangeChange(
    targetType,
    unit,
    onChange,
    setValidationError
  );

  const handleMinChange = (newMin: string) => {
    setMinValue(newMin);
    handleRangeChange(newMin, maxValue);
  };

  const handleMaxChange = (newMax: string) => {
    setMaxValue(newMax);
    handleRangeChange(minValue, newMax);
  };

  const displayError = error || validationError;
  const unitOptions = getUnitOptions(targetType) || [];

  return (
    <div className={`space-y-4 ${className}`}>
      <Input
        variant="select"
        label="Target Type"
        value={targetType}
        onChange={handleTypeChange}
        disabled={disabled}
        options={TARGET_TYPE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        aria-label="Select target type"
      />

      {targetType !== "open" && unitOptions && unitOptions.length > 0 && (
        <Input
          variant="select"
          label="Unit"
          value={unit}
          onChange={handleUnitChange}
          disabled={disabled}
          options={unitOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          aria-label="Select target unit"
        />
      )}

      {targetType !== "open" && unit && unit !== "range" && (
        <Input
          variant="number"
          label={getValueLabel(targetType, unit)}
          value={targetValue}
          onChange={handleValueChange}
          disabled={disabled}
          error={displayError}
          placeholder={getValuePlaceholder(targetType, unit)}
          min="0"
          step={unit === "zone" ? "1" : "0.01"}
          aria-label={getValueLabel(targetType, unit)}
          aria-invalid={Boolean(displayError)}
          aria-describedby={displayError ? "target-error" : undefined}
        />
      )}

      {targetType !== "open" && unit === "range" && (
        <div className="space-y-3">
          <Input
            variant="number"
            label="Minimum"
            value={minValue}
            onChange={handleMinChange}
            disabled={disabled}
            error={displayError}
            placeholder="Enter minimum value"
            min="0"
            step="0.01"
            aria-label="Minimum value"
            aria-invalid={Boolean(displayError)}
          />
          <Input
            variant="number"
            label="Maximum"
            value={maxValue}
            onChange={handleMaxChange}
            disabled={disabled}
            error={displayError}
            placeholder="Enter maximum value"
            min="0"
            step="0.01"
            aria-label="Maximum value"
            aria-invalid={Boolean(displayError)}
            aria-describedby={displayError ? "target-error" : undefined}
          />
        </div>
      )}

      {targetType === "open" && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Open target (no specific intensity goal)
        </p>
      )}
    </div>
  );
};
