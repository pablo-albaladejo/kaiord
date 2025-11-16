import { Input } from "../../atoms/Input/Input";

type TargetValueInputProps = {
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open";
  unit: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string;
  getValueLabel: (
    type: "power" | "heart_rate" | "pace" | "cadence" | "open",
    unit: string
  ) => string;
  getValuePlaceholder: (
    type: "power" | "heart_rate" | "pace" | "cadence" | "open",
    unit: string
  ) => string;
};

export const TargetValueInput = ({
  targetType,
  unit,
  value,
  onChange,
  disabled,
  error,
  getValueLabel,
  getValuePlaceholder,
}: TargetValueInputProps) => {
  return (
    <Input
      variant="number"
      label={getValueLabel(targetType, unit)}
      value={value}
      onChange={onChange}
      disabled={disabled}
      error={error}
      placeholder={getValuePlaceholder(targetType, unit)}
      min="0"
      step={unit === "zone" ? "1" : "0.01"}
      aria-label={getValueLabel(targetType, unit)}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? "target-error" : undefined}
    />
  );
};
