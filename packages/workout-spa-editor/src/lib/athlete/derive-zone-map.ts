import type { ZoneMapEntry } from "../../components/organisms/ZoneMap";
import type { Profile } from "../../types/profile";
import type { Units } from "../units/units";
import { paceSecondsFactor, paceUnitLabelFor } from "../units/units";
import type { ActiveSport } from "./sports";
import { buildZoneMap } from "./zone-bands";
import { HR_MODEL, PACE_MODEL, POWER_MODEL } from "./zone-models";

/** Derives the canonical 5-zone map for a sport from its stored threshold.
    Primary metric: cycling→power, running/swimming→pace; falls back to HR
    (LTHR) when the primary threshold is missing. Returns null when no usable
    threshold exists for the sport. */
export function deriveZoneMap(
  profile: Profile,
  sport: ActiveSport,
  units: Units = "metric"
): ZoneMapEntry[] | null {
  const thresholds = profile.sportZones[sport]?.thresholds;
  if (!thresholds) return null;

  if (sport === "cycling" && thresholds.ftp) {
    return buildZoneMap(POWER_MODEL, thresholds.ftp, " W");
  }
  if (sport !== "cycling" && thresholds.thresholdPace) {
    const base =
      thresholds.paceUnit ??
      (sport === "swimming" ? "min_per_100m" : "min_per_km");
    return buildZoneMap(
      PACE_MODEL,
      thresholds.thresholdPace * paceSecondsFactor(base, units),
      ` ${paceUnitLabelFor(base, units)}`
    );
  }
  if (thresholds.lthr) return buildZoneMap(HR_MODEL, thresholds.lthr, " bpm");
  return null;
}
