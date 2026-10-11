import type { Profile } from "../../../types/profile";
import { Input } from "../../atoms/Input/Input";
import { useZoneInfo } from "./hooks/useZoneInfo";

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
  // A pace is typed as m:ss, which a number input cannot hold.
  const clock = targetType === "pace" && unit === "mps";

  return (
    <div className="space-y-1">
      <Input
        variant={clock ? "text" : "number"}
        inputMode={clock ? "numeric" : "decimal"}
        label={getValueLabel(targetType, unit)}
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={error}
        placeholder={getValuePlaceholder(targetType, unit)}
        min={clock ? undefined : "0"}
        step={clock ? undefined : unit === "zone" ? "1" : "0.01"}
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
