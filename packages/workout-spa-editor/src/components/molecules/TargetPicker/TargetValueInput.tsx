import { useZoneInfo } from "./hooks/useZoneInfo";
import { Input } from "../../atoms/Input/Input";
import type { Profile } from "../../../types/profile";

type TargetValueInputProps = {
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open";
  unit: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string;
  activeProfile?: Profile | null;
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
  activeProfile,
  getValueLabel,
  getValuePlaceholder,
}: TargetValueInputProps) => {
  const zoneInfo = useZoneInfo(targetType, unit, value, activeProfile);

  return (
    <div className="space-y-1">
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
      {zoneInfo && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{zoneInfo}</p>
      )}
    </div>
  );
};
