import { TARGET_TYPE_OPTIONS } from "./constants";
import { Input } from "../../atoms/Input/Input";

type TargetTypeSelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
};

export const TargetTypeSelect = ({
  value,
  onChange,
  disabled,
}: TargetTypeSelectProps) => {
  return (
    <Input
      variant="select"
      label="Target Type"
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={TARGET_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      }))}
      aria-label="Select target type"
    />
  );
};
