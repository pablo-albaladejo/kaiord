/**
 * `groupConflicts` — partitions a flat ConflictItem array into:
 *   1. Threshold scalars (the legacy 7 keys; rendered per-row).
 *   2. Band-level groups by `<sport>.<kind>` table.
 *   3. Coupled FTP+cycling-power group (when both FTP scalar AND
 *      cycling.powerZones bands have conflicts — D-MA6).
 */
import { tableKeyOfField } from "../../../application/coaching/sync-zones-snapshot";
import type { ConflictItem } from "../../../types/coaching-zones";

export type BandGroup = {
  groupKey: string;
  sport: "cycling" | "running" | "swimming";
  kind: "heartRateZones" | "powerZones" | "paceZones";
  label: string;
  conflicts: ConflictItem[];
};

export type CoupledFtpGroup = {
  groupKey: "cycling.threshold-and-zones";
  label: "Cycling threshold + zones";
  ftpConflict: ConflictItem;
  powerBandConflicts: ConflictItem[];
};

export type GroupedConflicts = {
  scalars: ConflictItem[];
  bandGroups: BandGroup[];
  ftpCoupled?: CoupledFtpGroup;
};

import { buildGroup } from "./group-conflicts-labels";

export const groupConflicts = (
  conflicts: readonly ConflictItem[]
): GroupedConflicts => {
  const scalars: ConflictItem[] = [];
  const bandTables = new Map<string, BandGroup>();
  let ftpScalar: ConflictItem | undefined;
  for (const c of conflicts) {
    if (c.field === "cycling.thresholds.ftp") {
      ftpScalar = c;
      continue;
    }
    const tk = tableKeyOfField(c.field);
    if (!tk) {
      scalars.push(c);
      continue;
    }
    const sport = tk.sport as BandGroup["sport"];
    const kind = tk.kind as BandGroup["kind"];
    const groupKey = `${sport}.${kind}`;
    let group = bandTables.get(groupKey);
    if (!group) {
      group = buildGroup(sport, kind);
      bandTables.set(groupKey, group);
    }
    group.conflicts.push(c);
  }
  const cyclingPower = bandTables.get("cycling.powerZones");
  if (ftpScalar && cyclingPower) {
    bandTables.delete("cycling.powerZones");
    return {
      scalars,
      bandGroups: Array.from(bandTables.values()),
      ftpCoupled: {
        groupKey: "cycling.threshold-and-zones",
        label: "Cycling threshold + zones",
        ftpConflict: ftpScalar,
        powerBandConflicts: cyclingPower.conflicts,
      },
    };
  }
  if (ftpScalar) scalars.push(ftpScalar);
  return { scalars, bandGroups: Array.from(bandTables.values()) };
};
