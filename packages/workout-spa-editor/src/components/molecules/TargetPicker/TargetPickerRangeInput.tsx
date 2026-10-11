import { Input } from "../../atoms/Input/Input";

type TargetPickerRangeInputProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder: string;
  ariaLabel: string;
  hasError: boolean;
  clock?: boolean;
};

export function TargetPickerRangeInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  ariaLabel,
  hasError,
  clock = false,
}: TargetPickerRangeInputProps) {
  return (
    <Input
      variant={clock ? "text" : "number"}
      inputMode={clock ? "numeric" : "decimal"}
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      min={clock ? undefined : "0"}
      step={clock ? undefined : "0.01"}
      aria-label={ariaLabel}
      aria-invalid={hasError}
    />
  );
}
