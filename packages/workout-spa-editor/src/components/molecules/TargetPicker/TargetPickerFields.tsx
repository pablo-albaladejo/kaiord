import { Input } from "../../atoms/Input/Input";
import { TARGET_TYPE_OPTIONS } from "./constants";
import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";
import { TargetPickerRangeFields } from "./TargetPickerRangeFields";

export const TargetPickerFields = ({
  targetType,
  unit,
  targetValue,
  minValue,
  maxValue,
  displayError,
  disabled,
  unitOptions,
  onTypeChange,
  onUnitChange,
  onValueChange,
  onMinChange,
  onMaxChange,
  getValueLabel,
  getValuePlaceholder,
}: TargetPickerFieldsProps) => {
  return (
    <>
      <Input
        variant="select"
        label="Target Type"
        value={targetType}
        onChange={onTypeChange}
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
          onChange={onUnitChange}
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
          onChange={onValueChange}
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
        <TargetPickerRangeFields
          minValue={minValue}
          maxValue={maxValue}
          displayError={displayError}
          disabled={disabled}
          onMinChange={onMinChange}
          onMaxChange={onMaxChange}
        />
      )}

      {targetType === "open" && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Open target (no specific intensity goal)
          </p>
          {displayError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {displayError}
            </p>
          )}
        </>
      )}
    </>
  );
};
