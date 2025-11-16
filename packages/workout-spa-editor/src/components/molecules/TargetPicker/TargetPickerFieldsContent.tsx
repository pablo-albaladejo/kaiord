import { TargetOpenMessage } from "./TargetOpenMessage";
import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";
import { TargetPickerRangeFields } from "./TargetPickerRangeFields";
import { TargetUnitSelect } from "./TargetUnitSelect";
import { TargetValueInput } from "./TargetValueInput";

type TargetPickerFieldsContentProps = Omit<
  TargetPickerFieldsProps,
  "onTypeChange"
>;

export function TargetPickerFieldsContent({
  targetType,
  unit,
  targetValue,
  minValue,
  maxValue,
  displayError,
  disabled,
  unitOptions,
  onUnitChange,
  onValueChange,
  onMinChange,
  onMaxChange,
  getValueLabel,
  getValuePlaceholder,
}: TargetPickerFieldsContentProps) {
  if (targetType === "open") {
    return <TargetOpenMessage error={displayError} />;
  }

  const showUnitSelect = unitOptions && unitOptions.length > 0;
  const showValueInput = unit && unit !== "range";
  const showRangeFields = unit === "range";

  return (
    <>
      {showUnitSelect && (
        <TargetUnitSelect
          value={unit}
          onChange={onUnitChange}
          disabled={disabled}
          options={unitOptions}
        />
      )}

      {showValueInput && (
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

      {showRangeFields && (
        <TargetPickerRangeFields
          minValue={minValue}
          maxValue={maxValue}
          displayError={displayError}
          disabled={disabled}
          onMinChange={onMinChange}
          onMaxChange={onMaxChange}
        />
      )}
    </>
  );
}
