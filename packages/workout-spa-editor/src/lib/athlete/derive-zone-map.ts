import type { ZoneMapEntry } from "../../components/organisms/ZoneMap";
import type { Profile } from "../../types/profile";
import type { ZoneNumber } from "../zone-colors";
import { formatPace, paceUnitLabel } from "./format";
import type { ActiveSport } from "./sports";
import {
  HR_MODEL,
  PACE_MODEL,
  POWER_MODEL,
  ZONE_WEIGHTS,
  type ZoneBandModel,
} from "./zone-models";

type Bands = readonly [number, number, number, number];

function ascendingRanges(threshold: number, bounds: Bands, suffix: string) {
  const [a, b, c, d] = bounds.map((fraction) =>
    Math.round(threshold * fraction)
  );
  return [
    `< ${a}${suffix}`,
    `${a}–${b}${suffix}`,
    `${b}–${c}${suffix}`,
    `${c}–${d}${suffix}`,
    `> ${d}${suffix}`,
  ] as const;
}

function paceRanges(threshold: number, bounds: Bands, suffix: string) {
  const [a, b, c, d] = bounds.map((fraction) =>
    formatPace(threshold / fraction)
  );
  return [
    `> ${a}${suffix}`,
    `${b}–${a}${suffix}`,
    `${c}–${b}${suffix}`,
    `${d}–${c}${suffix}`,
    `< ${d}${suffix}`,
  ] as const;
}

function buildZoneMap(
  model: ZoneBandModel,
  threshold: number,
  suffix: string
): ZoneMapEntry[] {
  const ranges =
    model.kind === "pace"
      ? paceRanges(threshold, model.bounds, suffix)
      : ascendingRanges(threshold, model.bounds, suffix);
  return model.names.map((name, i) => ({
    n: (i + 1) as ZoneNumber,
    name,
    range: ranges[i]!,
    pct: model.pcts[i]!,
    w: ZONE_WEIGHTS[i]!,
  }));
}

/** Derives the canonical 5-zone map for a sport from its stored threshold.
    Primary metric: cycling→power, running/swimming→pace; falls back to HR
    (LTHR) when the primary threshold is missing. Returns null when no usable
    threshold exists for the sport. */
export function deriveZoneMap(
  profile: Profile,
  sport: ActiveSport
): ZoneMapEntry[] | null {
  const thresholds = profile.sportZones[sport]?.thresholds;
  if (!thresholds) return null;

  if (sport === "cycling" && thresholds.ftp) {
    return buildZoneMap(POWER_MODEL, thresholds.ftp, " W");
  }
  if (sport !== "cycling" && thresholds.thresholdPace) {
    const unit =
      thresholds.paceUnit ??
      (sport === "swimming" ? "min_per_100m" : "min_per_km");
    return buildZoneMap(
      PACE_MODEL,
      thresholds.thresholdPace,
      ` ${paceUnitLabel(unit)}`
    );
  }
  if (thresholds.lthr) return buildZoneMap(HR_MODEL, thresholds.lthr, " bpm");
  return null;
}
