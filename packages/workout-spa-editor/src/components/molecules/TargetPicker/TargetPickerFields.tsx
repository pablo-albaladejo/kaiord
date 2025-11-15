import { TargetOpenMessage } from "./TargetOpenMessage";
import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";
import { TargetPickerRangeFields } from "./TargetPickerRangeFields";
import { TargetTypeSelect } from "./TargetTypeSelect";
import { TargetUnitSelect } from "./TargetUnitSelect";
import { TargetValueInput } from "./TargetValueInput";

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
      <TargetTypeSelect
        value={targetType}
        onChange={onTypeChange}
        disabled={disabled}
      />

      {targetType !== "open" && unitOptions && unitOptions.length > 0 && (
        <TargetUnitSelect
          value={unit}
          onChange={onUnitChange}
          disabled={disabled}
          options={unitOptions}
        />
      )}

      {targetType !== "open" && unit && unit !== "range" && (
        <TargetValueInput
          targetType={targetType}
          unit={unit}
          value={targetValue}
          onChange={onValueChange}
          disabled={disabled}
          error={displayError}
          getValueLabel={getValueLabel}
          getValuePlaceholder={getValuePlaceholder}
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

      {targetType === "open" && <TargetOpenMessage error={displayError} />}
    </>
  );
};
