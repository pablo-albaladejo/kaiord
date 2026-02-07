/**
 * ZoneInputs Component
 *
 * Input fields for zone ranges.
 */

import { Input } from "../../../atoms/Input/Input";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";

type ZoneInputsProps = {
  zone: PowerZone | HeartRateZone;
  index: number;
  isPowerZones: boolean;
  onZoneChange: (
    index: number,
    field: "name" | "minPercent" | "maxPercent" | "minBpm" | "maxBpm",
    value: string | number
  ) => void;
};

export function ZoneInputs({
  zone,
  index,
  isPowerZones,
  onZoneChange,
}: ZoneInputsProps) {
  if (isPowerZones) {
    return (
      <>
        <Input
          label="Min %"
          type="number"
          value={(zone as PowerZone).minPercent}
          onChange={(e) => onZoneChange(index, "minPercent", e.target.value)}
          min={0}
          max={200}
        />
        <Input
          label="Max %"
          type="number"
          value={(zone as PowerZone).maxPercent}
          onChange={(e) => onZoneChange(index, "maxPercent", e.target.value)}
          min={0}
          max={200}
        />
      </>
    );
  }

  return (
    <>
      <Input
        label="Min BPM"
        type="number"
        value={(zone as HeartRateZone).minBpm}
        onChange={(e) => onZoneChange(index, "minBpm", e.target.value)}
        min={0}
        max={250}
      />
      <Input
        label="Max BPM"
        type="number"
        value={(zone as HeartRateZone).maxBpm}
        onChange={(e) => onZoneChange(index, "maxBpm", e.target.value)}
        min={0}
        max={250}
      />
    </>
  );
}
