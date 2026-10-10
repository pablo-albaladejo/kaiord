/**
 * Applies a `ProfileRekey` to a whole snapshot: per-profile tables move
 * their source rows onto the target (`rekeyTableRows`), the source profiles
 * are removed WITHOUT a tombstone (they never left the device, so no other
 * device can hold them), `meta.activeProfileId` follows them to the target,
 * and tombstones naming a source row are re-keyed with it. Pure.
 */

import type { Snapshot, Tombstone } from "../../types/snapshot";
import { unionTombstones } from "./merge-tombstones";
import {
  type ProfileRekey,
  rekeyRow,
  rekeyTableRows,
} from "./rekey-profile-rows";

type Row = Record<string, unknown>;

const ACTIVE_PROFILE_KEY = "activeProfileId";

const rekeyMeta = (rows: ReadonlyArray<Row>, rekey: ProfileRekey): Row[] =>
  rows.map((row) =>
    row.key === ACTIVE_PROFILE_KEY &&
    typeof row.value === "string" &&
    rekey.from.includes(row.value)
      ? { ...row, value: rekey.to }
      : row
  );

const rekeyTable = (
  name: string,
  rows: ReadonlyArray<unknown>,
  rekey: ProfileRekey,
  perProfile: ReadonlySet<string>
): ReadonlyArray<unknown> => {
  if (name === "profiles")
    return (rows as Row[]).filter((p) => !rekey.from.includes(String(p.id)));
  if (name === "meta") return rekeyMeta(rows as Row[], rekey);
  return perProfile.has(name) ? rekeyTableRows(name, rows, rekey) : rows;
};

export function rekeySnapshot(
  snapshot: Snapshot,
  rekey: ProfileRekey,
  perProfileTables: ReadonlyArray<string>
): Snapshot {
  const perProfile = new Set(perProfileTables);
  const tables: Record<string, ReadonlyArray<unknown>> = {};
  for (const [name, rows] of Object.entries(snapshot.tables)) {
    tables[name] = rekeyTable(name, rows, rekey, perProfile);
  }
  const tombstones = snapshot.tombstones.map(
    (t) => rekeyRow(t as unknown as Row, rekey) as unknown as Tombstone
  );
  return {
    manifest: snapshot.manifest,
    tables,
    tombstones: unionTombstones(tombstones, []),
  };
}
