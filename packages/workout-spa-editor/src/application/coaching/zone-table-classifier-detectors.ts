/**
 * Zone-table classifier detectors — pure predicates for the 6 states
 * (per design D-MA1 of zones-method-aware-reconcile). Co-located with
 * `zone-table-classifier.ts` so the parent stays under the 80-line cap.
 */
import type { HeartRateZone, PowerZone, Profile } from "../../types/profile";
import type { PaceZone } from "../../types/sport-zones";
import { calculateHrZones } from "../../utils/calculate-hr-zones";
import { calculatePaceZones } from "../../utils/calculate-pace-zones";
import { calculatePowerZones } from "../../utils/calculate-power-zones";
import {
  ALL_FORMULA_IDS,
  type Sport,
  type ZoneKind,
} from "./zone-table-classifier-types";

export const isAllZeroHr = (zones: HeartRateZone[]): boolean =>
  zones.length === 5 && zones.every((z) => z.minBpm === 0 && z.maxBpm === 0);

export const isAllZeroPace = (zones: PaceZone[]): boolean =>
  zones.length === 5 && zones.every((z) => z.minPace === 0 && z.maxPace === 0);

export const isFormulaId = (method: string): boolean =>
  ALL_FORMULA_IDS.has(method);

export const equalsHrZones = (
  a: HeartRateZone[],
  b: HeartRateZone[]
): boolean =>
  a.length === b.length &&
  a.every((z, i) => z.minBpm === b[i]!.minBpm && z.maxBpm === b[i]!.maxBpm);

export const equalsPowerZones = (a: PowerZone[], b: PowerZone[]): boolean =>
  a.length === b.length &&
  a.every(
    (z, i) =>
      z.minPercent === b[i]!.minPercent && z.maxPercent === b[i]!.maxPercent
  );

export const equalsPaceZones = (a: PaceZone[], b: PaceZone[]): boolean =>
  a.length === b.length &&
  a.every(
    (z, i) =>
      z.minPace === b[i]!.minPace &&
      z.maxPace === b[i]!.maxPace &&
      z.unit === b[i]!.unit
  );

export const matchesHrFormula = (
  zones: HeartRateZone[],
  method: string,
  lthr: number | undefined
): boolean => {
  if (!lthr || lthr <= 0) return false;
  return equalsHrZones(zones, calculateHrZones(lthr, method));
};

export const matchesPowerFormula = (
  zones: PowerZone[],
  method: string
): boolean => equalsPowerZones(zones, calculatePowerZones(method));

export const matchesPaceFormula = (
  zones: PaceZone[],
  method: string,
  thresholdPace: number | undefined,
  unit: "min_per_km" | "min_per_100m" | undefined
): boolean => {
  if (!thresholdPace || thresholdPace <= 0 || !unit) return false;
  return equalsPaceZones(
    zones,
    calculatePaceZones(thresholdPace, unit, method)
  );
};

export const getThreshold = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind
): number | undefined => {
  const t = profile.sportZones[sport]?.thresholds;
  if (!t) return undefined;
  if (kind === "heartRateZones") return t.lthr;
  if (kind === "powerZones") return t.ftp;
  return t.thresholdPace;
};
