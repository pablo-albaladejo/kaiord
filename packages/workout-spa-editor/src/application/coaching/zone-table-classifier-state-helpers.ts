/**
 * Per-state detection helpers for `classifyZoneTable`. Co-located so
 * the classifier stays under the 80-line file cap.
 */
import type { HeartRateZone, PowerZone, Profile } from "../../types/profile";
import type { PaceZone } from "../../types/sport-zones";
import {
  equalsHrZones,
  equalsPaceZones,
  equalsPowerZones,
  getThreshold,
  isAllZeroHr,
  isAllZeroPace,
  matchesHrFormula,
  matchesPaceFormula,
  matchesPowerFormula,
} from "./zone-table-classifier-detectors";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

export const isFormulaDerived = (
  zones: unknown[],
  method: string,
  profile: Profile,
  sport: Sport,
  kind: ZoneKind
): boolean => {
  if (kind === "heartRateZones") {
    return matchesHrFormula(
      zones as HeartRateZone[],
      method,
      getThreshold(profile, sport, kind)
    );
  }
  if (kind === "powerZones") {
    return matchesPowerFormula(zones as PowerZone[], method);
  }
  return matchesPaceFormula(
    zones as PaceZone[],
    method,
    getThreshold(profile, sport, kind),
    profile.sportZones[sport]?.thresholds.paceUnit
  );
};

export const equalsSnapshot = (
  zones: unknown[],
  snapshotZones: unknown[] | undefined,
  kind: ZoneKind
): boolean => {
  if (!snapshotZones) return false;
  if (kind === "heartRateZones")
    return equalsHrZones(
      zones as HeartRateZone[],
      snapshotZones as HeartRateZone[]
    );
  if (kind === "powerZones")
    return equalsPowerZones(zones as PowerZone[], snapshotZones as PowerZone[]);
  return equalsPaceZones(zones as PaceZone[], snapshotZones as PaceZone[]);
};

export const isDefaultTemplate = (
  zones: unknown[],
  kind: ZoneKind
): boolean => {
  if (kind === "heartRateZones") return isAllZeroHr(zones as HeartRateZone[]);
  if (kind === "paceZones") return isAllZeroPace(zones as PaceZone[]);
  return false;
};
