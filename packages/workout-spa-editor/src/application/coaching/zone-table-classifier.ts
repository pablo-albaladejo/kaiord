/**
 * `classifyZoneTable(profile, sport, kind, snapshot)` — returns one of
 * the six canonical states (per design D-MA1 of
 * zones-method-aware-reconcile). Drives the reconcile strategy in
 * `sync-zones-helpers.ts:reconcile`.
 */
import type { LastSyncedZonesSnapshot } from "../../types/coaching-account";
import type { Profile } from "../../types/profile";
import { isFormulaId } from "./zone-table-classifier-detectors";
import {
  equalsSnapshot,
  isDefaultTemplate,
  isFormulaDerived,
} from "./zone-table-classifier-state-helpers";
import type {
  Sport,
  ZoneKind,
  ZoneTableState,
} from "./zone-table-classifier-types";

const SNAPSHOT_KEY: Record<
  `${Sport}.${ZoneKind}`,
  keyof LastSyncedZonesSnapshot
> = {
  "cycling.heartRateZones": "cyclingHr",
  "running.heartRateZones": "runningHr",
  "swimming.heartRateZones": "swimmingHr",
  "cycling.powerZones": "cyclingPower",
  "running.paceZones": "runningPace",
  "swimming.paceZones": "swimmingPace",
  "cycling.paceZones": "runningPace",
  "running.powerZones": "cyclingPower",
  "swimming.powerZones": "cyclingPower",
};

export const classifyZoneTable = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind,
  snapshot: LastSyncedZonesSnapshot | undefined
): ZoneTableState => {
  const cfg = profile.sportZones[sport];
  const zc = cfg ? (cfg as Record<string, unknown>)[kind] : undefined;
  const config = zc as { method?: string; zones?: unknown[] } | undefined;
  const zones = config?.zones;
  if (!Array.isArray(zones) || zones.length === 0) return "empty";
  const method = config?.method ?? "custom";
  if (method === "train2go") {
    if (!snapshot) return "user-customized";
    const snapZones = snapshot[SNAPSHOT_KEY[`${sport}.${kind}`]] as
      unknown[] | undefined;
    return equalsSnapshot(zones, snapZones, kind)
      ? "train2go-synced-clean"
      : "train2go-synced-edited";
  }
  if (method === "user") return "user-customized";
  if (
    isFormulaId(method) &&
    isFormulaDerived(zones, method, profile, sport, kind)
  ) {
    return "method-derived";
  }
  if (isDefaultTemplate(zones, kind)) return "default-template";
  return "user-customized";
};
