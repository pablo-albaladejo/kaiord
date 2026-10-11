/**
 * reconcileAutoProfile — keeps the unclaimed default profile off the wire.
 *
 * Runs between `mergeSnapshots` and `importSnapshot` on every sync attempt,
 * so nothing imported or pushed carries an `origin: "auto"` profile. The
 * target is read from the REMOTE snapshot (the merged `meta` is usually the
 * local one):
 *   - no real remote profile: the auto profile is claimed (`origin: "local"`)
 *     and syncs as a normal profile;
 *   - exactly one: every auto row is re-keyed onto it and the auto profile
 *     is dropped;
 *   - several: `needsChoice` unless the user already picked one (`choice`);
 *     the caller must not import or push in that case.
 * The stored choice row is always stripped so it never travels. Pure.
 */

import type { Snapshot } from "../../types/snapshot";
import { isAutoProfile } from "../profile/helpers/claim-profile";
import type { ProfileRekey } from "./rekey-profile-rows";
import { rekeySnapshot } from "./rekey-snapshot";

type Row = Record<string, unknown>;

export const AUTO_PROFILE_CHOICE_KEY = "autoProfileChoice";

export type ProfileChoice = { id: string; name: string };

export type ReconcileOptions = { choice?: string | null; now?: () => Date };

export type ReconcileResult =
  | { kind: "ready"; snapshot: Snapshot; deviceLocalRekey: ProfileRekey | null }
  | { kind: "needsChoice"; candidates: ProfileChoice[] };

const rowsOf = (s: Snapshot | null, table: string): Row[] =>
  (s?.tables[table] ?? []) as Row[];

const withTable = (s: Snapshot, table: string, rows: Row[]): Snapshot => ({
  ...s,
  tables: { ...s.tables, [table]: rows },
});

const claim = (s: Snapshot, now: () => Date): Snapshot =>
  withTable(
    s,
    "profiles",
    rowsOf(s, "profiles").map((p) =>
      isAutoProfile(p)
        ? { ...p, origin: "local", updatedAt: now().toISOString() }
        : p
    )
  );

const ready = (snapshot: Snapshot, rekey: ProfileRekey | null) =>
  ({ kind: "ready", snapshot, deviceLocalRekey: rekey }) as const;

export function reconcileAutoProfile(
  merged: Snapshot,
  remote: Snapshot | null,
  perProfileTables: ReadonlyArray<string>,
  { choice = null, now = () => new Date() }: ReconcileOptions = {}
): ReconcileResult {
  const meta = rowsOf(merged, "meta");
  const base = meta.some((r) => r.key === AUTO_PROFILE_CHOICE_KEY)
    ? withTable(
        merged,
        "meta",
        meta.filter((r) => r.key !== AUTO_PROFILE_CHOICE_KEY)
      )
    : merged;
  const profiles = rowsOf(base, "profiles");
  const autoIds = profiles.filter(isAutoProfile).map((p) => String(p.id));
  if (autoIds.length === 0) return ready(base, null);
  const present = new Set(profiles.map((p) => p.id));
  const real = rowsOf(remote, "profiles").filter(
    (p) => !isAutoProfile(p) && present.has(p.id)
  );
  if (real.length === 0) return ready(claim(base, now), null);
  const target =
    real.length === 1 ? real[0] : real.find((p) => p.id === choice);
  if (!target) {
    const candidates = real.map((p) => ({
      id: String(p.id),
      name: String(p.name ?? ""),
    }));
    return { kind: "needsChoice", candidates };
  }
  const rekey = { from: autoIds, to: String(target.id) };
  return ready(rekeySnapshot(base, rekey, perProfileTables), rekey);
}
