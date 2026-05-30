import type { Target } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";
import { HR_MODEL, PACE_MODEL, POWER_MODEL } from "../athlete/zone-models";
import type { ZoneNumber } from "../zone-colors";

const MAX_ZONE = 5 as const;
const PER_100M_METERS = 100;
const PER_KM_METERS = 1000;

/** Map an ascending fraction into Z1..Z5 against four ascending bounds. */
export function classifyAscending(
  bounds: readonly [number, number, number, number],
  fraction: number
): ZoneNumber {
  if (fraction < bounds[0]) return 1;
  if (fraction < bounds[1]) return 2;
  if (fraction < bounds[2]) return 3;
  if (fraction < bounds[3]) return 4;
  return MAX_ZONE;
}

const clampZone = (value: number): ZoneNumber =>
  Math.min(value, MAX_ZONE) as ZoneNumber;

function classifyPower(
  value: Target & { type: "power" },
  thresholds: SportThresholds
): ZoneNumber | null {
  const v = value.value;
  if (v.unit === "zone") return clampZone(v.value);
  if (v.unit === "percent_ftp")
    return classifyAscending(POWER_MODEL.bounds, v.value / 100);
  if (v.unit === "watts" && thresholds.ftp)
    return classifyAscending(POWER_MODEL.bounds, v.value / thresholds.ftp);
  return null;
}

function classifyHeartRate(
  value: Target & { type: "heart_rate" },
  thresholds: SportThresholds
): ZoneNumber | null {
  const v = value.value;
  if (v.unit === "zone") return clampZone(v.value);
  if (v.unit === "bpm" && thresholds.lthr)
    return classifyAscending(HR_MODEL.bounds, v.value / thresholds.lthr);
  return null;
}

function classifyPace(
  value: Target & { type: "pace" },
  thresholds: SportThresholds
): ZoneNumber | null {
  const v = value.value;
  if (v.unit === "zone") return clampZone(v.value);
  if (v.unit === "mps" && thresholds.thresholdPace) {
    const metersPerLap =
      thresholds.paceUnit === "min_per_100m" ? PER_100M_METERS : PER_KM_METERS;
    const thresholdSpeed = metersPerLap / thresholds.thresholdPace;
    return classifyAscending(PACE_MODEL.bounds, v.value / thresholdSpeed);
  }
  return null;
}

/** Resolve a target to its 5-zone band, or null when not classifiable. */
export function classifyTargetZone(
  target: Target,
  thresholds: SportThresholds
): ZoneNumber | null {
  if (target.type === "power") return classifyPower(target, thresholds);
  if (target.type === "heart_rate")
    return classifyHeartRate(target, thresholds);
  if (target.type === "pace") return classifyPace(target, thresholds);
  return null;
}
