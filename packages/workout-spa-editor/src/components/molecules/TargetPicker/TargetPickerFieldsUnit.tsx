import { TargetUnitSelect } from "./TargetUnitSelect";
import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";

type TargetPickerFieldsUnitProps = Pick<
  TargetPickerFieldsProps,
  "unit" | "disabled" | "unitOptions" | "onUnitChange"
>;

export function TargetPickerFieldsUnit({
  unit,
  disabled,
  unitOptions,
  onUnitChange,
}: TargetPickerFieldsUnitProps) {
  if (!unitOptions || unitOptions.length === 0) {
    return null;
  }

  return (
    <TargetUnitSelect
      value={unit}
      onChange={onUnitChange}
      disabled={disabled}
      options={unitOptions}
    />
  );
}
