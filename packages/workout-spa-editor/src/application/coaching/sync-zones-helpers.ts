/**
 * `reconcile` — splits an `IncomingMap` against the persisted profile
 * into silent fills (current value absent) vs. conflicts (current value
 * differs from incoming). No-op when current === incoming. Returns a
 * fresh profile with silent fills already applied; conflicts are NOT
 * written here — the caller (`syncZones`) returns them to the UI for
 * per-row confirmation.
 */
import type { ZonesReconciliation } from "../../types/coaching-zones";
import type { ConflictItem, WrittenField } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import type { IncomingMap } from "./sync-zones-payload-mapper";
import { readField, writeField } from "./sync-zones-profile-fields";

export const reconcile = (
  profile: Profile,
  incoming: IncomingMap
): { profile: Profile } & ZonesReconciliation => {
  const applied: WrittenField[] = [];
  const conflicts: ConflictItem[] = [];
  let next = profile;
  for (const [field, value] of incoming) {
    const current = readField(next, field);
    if (current === undefined) {
      next = writeField(next, field, value);
      applied.push({ field, value });
    } else if (current !== value) {
      conflicts.push({ field, current, incoming: value });
    }
  }
  return { profile: next, applied, conflicts };
};
