/**
 * Per-table band-decision application. For each `<sport>.<kind>` table:
 *   - All bands `accept` → method := "train2go"; persist T2G values.
 *   - Mixed accept/reject → method := "user"; persist merged values.
 *   - All bands `reject` → method/zones untouched.
 *
 * Snapshot is updated by `updateSnapshot` to reflect the POST-MERGE
 * persisted zones (per D-MA4): accepted bands take T2G; rejected bands
 * keep pre-sync user values.
 */
import type { ConflictDecision, FieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { applyOneTable } from "./commit-conflict-table-apply";
import { updateSnapshot } from "./sync-zones-snapshot-write";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

export const applyBandTableDecisions = (
  profile: Profile,
  bandTableKeys: Map<string, FieldKey[]>,
  decisions: Record<FieldKey, ConflictDecision>,
  incoming: Map<FieldKey, number>,
  source: string
): Profile => {
  let next = profile;
  const replacedTables: Array<{ sport: Sport; kind: ZoneKind }> = [];
  for (const [slot, keys] of bandTableKeys) {
    const [sport, kind] = slot.split(".") as [Sport, ZoneKind];
    const result = applyOneTable(next, sport, kind, keys, decisions, incoming);
    if (result.touched) {
      next = result.profile;
      replacedTables.push({ sport, kind });
    }
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
