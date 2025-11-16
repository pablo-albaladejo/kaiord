import { Input } from "../../atoms/Input/Input";

type TargetPickerRangeInputProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder: string;
  ariaLabel: string;
  hasError: boolean;
};

export function TargetPickerRangeInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  ariaLabel,
  hasError,
}: TargetPickerRangeInputProps) {
  return (
    <Input
      variant="number"
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      min="0"
      step="0.01"
      aria-label={ariaLabel}
      aria-invalid={hasError}
    />
  );
}
