import { Input } from "../../atoms/Input/Input";

type DurationValueInputProps = {
  durationType: "time" | "distance";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string;
  getValueLabel: (type: "time" | "distance" | "open") => string;
  getValuePlaceholder: (type: "time" | "distance" | "open") => string;
};

export function DurationValueInput({
  durationType,
  value,
  onChange,
  disabled,
  error,
  getValueLabel,
  getValuePlaceholder,
}: DurationValueInputProps) {
  return (
    <Input
      variant="number"
      label={getValueLabel(durationType)}
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
      placeholder={getValuePlaceholder(durationType)}
      min="0"
      step={durationType === "time" ? "1" : "0.01"}
      aria-label={getValueLabel(durationType)}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? "duration-error" : undefined}
    />
  );
}
