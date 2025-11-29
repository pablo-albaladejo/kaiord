import type { Profile } from "../../../types/profile";
import { Input } from "../../atoms/Input/Input";
import {
  calculateHeartRateFromZone,
  calculatePowerFromZone,
  getHeartRateZoneName,
  getPowerZoneName,
} from "./helpers";

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
  const zoneNumber = value ? Number.parseInt(value, 10) : null;
  let zoneInfo: string | null = null;

  if (unit === "zone" && zoneNumber && activeProfile) {
    if (targetType === "power") {
      const zoneName = getPowerZoneName(zoneNumber, activeProfile.powerZones);
      const zoneRange = calculatePowerFromZone(
        zoneNumber,
        activeProfile.powerZones,
        activeProfile.ftp
      );

      if (zoneName && zoneRange) {
        zoneInfo = `${zoneName} (${zoneRange.min}-${zoneRange.max}W)`;
      } else if (zoneName) {
        zoneInfo = zoneName;
      }
    } else if (targetType === "heart_rate") {
      const zoneName = getHeartRateZoneName(
        zoneNumber,
        activeProfile.heartRateZones
      );
      const zoneRange = calculateHeartRateFromZone(
        zoneNumber,
        activeProfile.heartRateZones
      );

      if (zoneName && zoneRange) {
        zoneInfo = `${zoneName} (${zoneRange.min}-${zoneRange.max} BPM)`;
      } else if (zoneName) {
        zoneInfo = zoneName;
      }
    }
  }

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
