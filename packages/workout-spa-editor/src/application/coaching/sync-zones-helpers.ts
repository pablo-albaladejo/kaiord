/**
 * `reconcile` — splits an `IncomingMap` against the persisted profile
 * into silent-replaces (via classifier dispatch per D-MA1) vs.
 * per-band conflicts (user-customized or train2go-synced-edited tables).
 * Updates the linked-account snapshot atomically per D-MA2.
 *
 * Threshold scalars keep their per-key path (delegated to
 * `reconcileThresholds`); only band-level FieldKeys go through the
 * 6-state classifier.
 */
import type {
  ConflictItem,
  WrittenField,
  ZonesReconciliation,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { reconcileBandTable } from "./sync-zones-band-table-reconcile";
import { partitionIncoming, reconcileThresholds } from "./sync-zones-partition";
import type { IncomingMap } from "./sync-zones-payload-mapper";
import {
  getSnapshotZones,
  snapshotZonesToFieldMap,
} from "./sync-zones-snapshot";
import { updateSnapshot } from "./sync-zones-snapshot-write";
import { classifyZoneTable } from "./zone-table-classifier";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

export const reconcile = (
  profile: Profile,
  incoming: IncomingMap,
  source: string
): { profile: Profile } & ZonesReconciliation => {
  const account = profile.linkedAccounts.find((a) => a.source === source);
  const snapshot = account?.lastSyncedZonesSnapshot;
  const { thresholds, tables } = partitionIncoming(incoming);
  const thrResult = reconcileThresholds(profile, thresholds);
  let next = thrResult.profile;
  const applied: WrittenField[] = [...thrResult.applied];
  const conflicts: ConflictItem[] = [...thrResult.conflicts];
  const replacedTables: Array<{ sport: Sport; kind: ZoneKind }> = [];
  for (const [tk, tableIncoming] of tables) {
    const [sport, kind] = tk.split(".") as [Sport, ZoneKind];
    const state = classifyZoneTable(profile, sport, kind, snapshot);
    const snapZones = getSnapshotZones(snapshot, sport, kind);
    const snapshotByField = snapZones
      ? snapshotZonesToFieldMap(snapZones, sport, kind)
      : undefined;
    const result = reconcileBandTable(
      next,
      state,
      sport,
      kind,
      tableIncoming,
      snapshotByField
    );
    next = result.profile;
    applied.push(...result.applied);
    conflicts.push(...result.conflicts);
    if (result.applied.length > 0) replacedTables.push({ sport, kind });
  }
  if (replacedTables.length > 0) {
    next = updateSnapshot(
      next,
      source,
      replacedTables,
      new Date().toISOString()
    );
  }
  return { profile: next, applied, conflicts };
};
