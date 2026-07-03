/**
 * `applyOneTable` — applies user decisions for a single sport-kind
 * table. All-accept → method "train2go"; mixed → "user"; all-reject →
 * untouched (per D-MA4 of zones-method-aware-reconcile).
 */
import type { ConflictDecision, FieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { writeField } from "./sync-zones-profile-fields";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

const setTableMethod = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind,
  method: string
): Profile => {
  const sportConfig = profile.sportZones[sport];
  if (!sportConfig) return profile;
  const tc = (sportConfig as Record<string, unknown>)[kind] as
    { method?: string; zones?: unknown[] } | undefined;
  if (!tc) return profile;
  return {
    ...profile,
    sportZones: {
      ...profile.sportZones,
      [sport]: { ...sportConfig, [kind]: { ...tc, method } },
    },
  };
};

export const applyOneTable = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind,
  keys: FieldKey[],
  decisions: Record<FieldKey, ConflictDecision>,
  incoming: Map<FieldKey, number>
): { profile: Profile; touched: boolean } => {
  let next = profile;
  let acceptCount = 0;
  let rejectCount = 0;
  for (const key of keys) {
    if (decisions[key] === "accept") {
      const value = incoming.get(key);
      if (value !== undefined) {
        next = writeField(next, key, value);
        acceptCount++;
      }
    } else if (decisions[key] === "reject") {
      rejectCount++;
    }
  }
  if (acceptCount === 0) return { profile: next, touched: false };
  const method = rejectCount > 0 ? "user" : "train2go";
  next = setTableMethod(next, sport, kind, method);
  return { profile: next, touched: true };
};
