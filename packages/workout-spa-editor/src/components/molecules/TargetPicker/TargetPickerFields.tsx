import { TargetPickerFieldsContent } from "./TargetPickerFieldsContent";
import { TargetTypeSelect } from "./TargetTypeSelect";
import type { TargetPickerFieldsProps } from "./TargetPickerFields.types";

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
