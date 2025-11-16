import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";
import { TargetPickerFieldsContent } from "./TargetPickerFieldsContent";
import { TargetTypeSelect } from "./TargetTypeSelect";

export const TargetPickerFields = ({
  targetType,
  onTypeChange,
  disabled,
  ...contentProps
}: TargetPickerFieldsProps) => {
  return (
    <>
      <TargetTypeSelect
        value={targetType}
        onChange={onTypeChange}
        disabled={disabled}
      />
      <TargetPickerFieldsContent
        targetType={targetType}
        disabled={disabled}
        {...contentProps}
      />
    </>
  );
};
