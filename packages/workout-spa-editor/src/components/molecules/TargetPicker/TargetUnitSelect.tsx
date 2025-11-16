import { Input } from "../../atoms/Input/Input";

type TargetUnitSelectProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
  options: Array<{ value: string; label: string }>;
};

export const TargetUnitSelect = ({
  value,
  onChange,
  disabled,
  options,
}: TargetUnitSelectProps) => {
  return (
    <Input
      variant="select"
      label="Unit"
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={options.map((opt) => ({
        value: opt.value,
        label: opt.label,
      }))}
      aria-label="Select target unit"
    />
  );
};
