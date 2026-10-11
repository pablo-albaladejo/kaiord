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
      variant={durationType === "time" ? "text" : "number"}
      inputMode={durationType === "time" ? "numeric" : "decimal"}
      label={getValueLabel(durationType)}
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
      placeholder={getValuePlaceholder(durationType)}
      min={durationType === "time" ? undefined : "0"}
      step={durationType === "time" ? undefined : "0.01"}
      aria-label={getValueLabel(durationType)}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? "duration-error" : undefined}
    />
  );
}
