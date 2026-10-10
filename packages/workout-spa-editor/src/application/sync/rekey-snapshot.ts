/**
 * Applies a `ProfileRekey` to a whole snapshot: per-profile tables move
 * their source rows onto the target (`rekeyTableRows`), the source profiles
 * are removed WITHOUT a tombstone (they never left the device, so no other
 * device can hold them), `meta.activeProfileId` follows them to the target,
 * and the source profiles' own tombstones are dropped. Pure.
 *
 * Tombstones are dropped, not re-keyed: an auto profile never synced, so no
 * other device holds the rows they name. Re-keying one would aim it at the
 * target's namespace instead — `auto:train2go:D` deleted on this device
 * would become `R:train2go:D` and delete the target's own live row
 * everywhere. Tombstones with a random id stay as they are; they cannot name
 * another profile's row.
 */

import type { Snapshot, Tombstone } from "../../types/snapshot";
import { type ProfileRekey, rekeyTableRows } from "./rekey-profile-rows";

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

const namesSource = (t: Tombstone, rekey: ProfileRekey): boolean =>
  rekey.from.some(
    (from) =>
      t.profileId === from || t.id === from || t.id.startsWith(`${from}:`)
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
  return {
    manifest: snapshot.manifest,
    tables,
    tombstones: snapshot.tombstones.filter((t) => !namesSource(t, rekey)),
  };
}
