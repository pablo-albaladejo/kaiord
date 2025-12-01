/**
 * ZoneCard Component
 *
 * Single zone editor card.
 */

import type {
  HeartRateZone,
  PowerZone,
  Profile,
} from "../../../../types/profile";
import { Input } from "../../../atoms/Input/Input";
import { getZoneColor } from "../utils/zone-colors";
import { ZoneInputs } from "./ZoneInputs";
import { ZonePreview } from "./ZonePreview";

type ZoneCardProps = {
  zone: PowerZone | HeartRateZone;
  index: number;
  isPowerZones: boolean;
  hasError: boolean;
  profile: Profile;
  onZoneChange: (
    index: number,
    field: "name" | "minPercent" | "maxPercent" | "minBpm" | "maxBpm",
    value: string | number
  ) => void;
};

export function ZoneCard({
  zone,
  index,
  isPowerZones,
  hasError,
  profile,
  onZoneChange,
}: ZoneCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        hasError
          ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${getZoneColor(zone.zone)} font-semibold text-gray-900 dark:text-white`}
        >
          {zone.zone}
        </div>
        <Input
          value={zone.name}
          onChange={(e) => onZoneChange(index, "name", e.target.value)}
          placeholder="Zone name"
          className="flex-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ZoneInputs
          zone={zone}
          index={index}
          isPowerZones={isPowerZones}
          onZoneChange={onZoneChange}
        />
      </div>

      {isPowerZones && (
        <ZonePreview zone={zone as PowerZone} profile={profile} />
      )}
    </div>
  );
}
