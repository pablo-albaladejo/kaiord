/**
 * Per-table band writes: each `<sport>.<kind>` table given at least one band
 * takes Train2Go's values for those bands and `method := "train2go"`; the
 * snapshot is updated by `updateSnapshot` to the post-write persisted zones
 * (D-MA4).
 */
import type { ConflictItem } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { applyOneTable } from "./commit-conflict-table-apply";
import { updateSnapshot } from "./sync-zones-snapshot-write";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

export const applyBandTables = (
  profile: Profile,
  bandTables: Map<string, ConflictItem[]>,
  source: string
): Profile => {
  let next = profile;
  const replacedTables: Array<{ sport: Sport; kind: ZoneKind }> = [];
  for (const [slot, bands] of bandTables) {
    const [sport, kind] = slot.split(".") as [Sport, ZoneKind];
    next = applyOneTable(next, sport, kind, bands);
    replacedTables.push({ sport, kind });
  }
  if (replacedTables.length > 0) {
    next = updateSnapshot(
      next,
      source,
      replacedTables,
      new Date().toISOString()
    );
  }
  return next;
};
