/**
 * Snapshot helpers — get/set `lastSyncedZonesSnapshot` on a linked
 * coaching account, and project snapshot zones into per-FieldKey maps
 * for the classifier's `train2go-synced-edited` per-band detection.
 */
import type { LastSyncedZonesSnapshot } from "../../types/coaching-account";
import type { FieldKey } from "../../types/coaching-zones";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

const KIND_TO_SNAPSHOT_KEY: Record<
  `${Sport}.${ZoneKind}`,
  keyof LastSyncedZonesSnapshot
> = {
  "cycling.heartRateZones": "cyclingHr",
  "running.heartRateZones": "runningHr",
  "swimming.heartRateZones": "swimmingHr",
  "cycling.powerZones": "cyclingPower",
  "running.paceZones": "runningPace",
  "swimming.paceZones": "swimmingPace",
  "cycling.paceZones": "runningPace", // unused (no cycling pace) — sentinel
  "running.powerZones": "cyclingPower", // unused
  "swimming.powerZones": "cyclingPower", // unused
};

export const getSnapshotZones = (
  snapshot: LastSyncedZonesSnapshot | undefined,
  sport: Sport,
  kind: ZoneKind
): unknown[] | undefined => {
  if (!snapshot) return undefined;
  const key = KIND_TO_SNAPSHOT_KEY[`${sport}.${kind}`];
  return snapshot[key] as unknown[] | undefined;
};

const BAND_KEY_RE =
  /^(cycling|running|swimming)\.(heartRateZones|powerZones|paceZones)\.(z[1-5])\.(minBpm|maxBpm|minPercent|maxPercent|minPace|maxPace)$/;

const BAND_INDEX: Record<string, number> = {
  z1: 0,
  z2: 1,
  z3: 2,
  z4: 3,
  z5: 4,
};

const BOUND_PROPS: Record<ZoneKind, [string, string]> = {
  heartRateZones: ["minBpm", "maxBpm"],
  powerZones: ["minPercent", "maxPercent"],
  paceZones: ["minPace", "maxPace"],
};

/**
 * Project the snapshot zones for a single sport-kind into a
 * `Map<FieldKey, number>` keyed by the band-level FieldKeys so the
 * `train2go-synced-edited` strategy can compare per-band against snapshot.
 */
export const snapshotZonesToFieldMap = (
  snapshotZones: unknown[] | undefined,
  sport: Sport,
  kind: ZoneKind
): Map<FieldKey, number> => {
  const out = new Map<FieldKey, number>();
  if (!snapshotZones) return out;
  const [minProp, maxProp] = BOUND_PROPS[kind];
  for (let i = 0; i < snapshotZones.length; i++) {
    const z = snapshotZones[i] as Record<string, number>;
    const band = `z${i + 1}`;
    out.set(`${sport}.${kind}.${band}.${minProp}` as FieldKey, z[minProp] ?? 0);
    out.set(`${sport}.${kind}.${band}.${maxProp}` as FieldKey, z[maxProp] ?? 0);
  }
  return out;
};

export const tableKeyOfField = (
  field: FieldKey
): { sport: Sport; kind: ZoneKind } | null => {
  const m = BAND_KEY_RE.exec(field);
  if (!m) return null;
  return { sport: m[1] as Sport, kind: m[2] as ZoneKind };
};

export const bandIndexOfField = (field: FieldKey): number | undefined => {
  const m = BAND_KEY_RE.exec(field);
  return m ? BAND_INDEX[m[3] ?? ""] : undefined;
};
