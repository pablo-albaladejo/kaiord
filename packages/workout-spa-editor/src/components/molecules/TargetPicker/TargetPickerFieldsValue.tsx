import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";
import { TargetPickerRangeFields } from "./TargetPickerRangeFields";
import { TargetValueInput } from "./TargetValueInput";

type TargetPickerFieldsValueProps = Pick<
  TargetPickerFieldsProps,
  | "targetType"
  | "unit"
  | "targetValue"
  | "minValue"
  | "maxValue"
  | "displayError"
  | "disabled"
  | "activeProfile"
  | "onValueChange"
  | "onMinChange"
  | "onMaxChange"
  | "getValueLabel"
  | "getValuePlaceholder"
>;

export function TargetPickerFieldsValue({
  unit,
  targetType,
  targetValue,
  minValue,
  maxValue,
  displayError,
  disabled,
  activeProfile,
  onValueChange,
  onMinChange,
  onMaxChange,
  getValueLabel,
  getValuePlaceholder,
}: TargetPickerFieldsValueProps) {
  if (!unit) return null;

  if (unit === "range") {
    return (
      <TargetPickerRangeFields
        minValue={minValue}
        maxValue={maxValue}
        displayError={displayError}
        disabled={disabled}
        onMinChange={onMinChange}
        onMaxChange={onMaxChange}
      />
    );
  }

  return (
    <TargetValueInput
      targetType={targetType}
      unit={unit}
      value={targetValue}
      onChange={onValueChange}
      disabled={disabled}
      error={displayError}
      activeProfile={activeProfile}
      getValueLabel={getValueLabel}
      getValuePlaceholder={getValuePlaceholder}
    />
  );
}
