import { TargetOpenMessage } from "./TargetOpenMessage";
import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";
import { TargetPickerFieldsUnit } from "./TargetPickerFieldsUnit";
import { TargetPickerFieldsValue } from "./TargetPickerFieldsValue";

type TargetPickerFieldsContentProps = Omit<
  TargetPickerFieldsProps,
  "onTypeChange"
>;

export function TargetPickerFieldsContent(
  props: TargetPickerFieldsContentProps
) {
  if (props.targetType === "open") {
    return <TargetOpenMessage error={props.displayError} />;
  }

  return (
    <>
      <TargetPickerFieldsUnit
        unit={props.unit}
        disabled={props.disabled}
        unitOptions={props.unitOptions}
        onUnitChange={props.onUnitChange}
      />
      <TargetPickerFieldsValue
        targetType={props.targetType}
        unit={props.unit}
        targetValue={props.targetValue}
        minValue={props.minValue}
        maxValue={props.maxValue}
        displayError={props.displayError}
        disabled={props.disabled}
        onValueChange={props.onValueChange}
        onMinChange={props.onMinChange}
        onMaxChange={props.onMaxChange}
        getValueLabel={props.getValueLabel}
        getValuePlaceholder={props.getValuePlaceholder}
      />
    </>
  );
}
