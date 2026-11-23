import type { ConflictItem } from "../../types/coaching-zones";
import { tableKeyOfField } from "./sync-zones-snapshot";

/** Splits the items to take into threshold scalars and per-table bands. */
export const partitionFields = (
  conflicts: readonly ConflictItem[]
): {
  thresholds: ConflictItem[];
  bandTables: Map<string, ConflictItem[]>;
} => {
  const thresholds: ConflictItem[] = [];
  const bandTables = new Map<string, ConflictItem[]>();
  for (const conflict of conflicts) {
    const tk = tableKeyOfField(conflict.field);
    if (!tk) {
      thresholds.push(conflict);
      continue;
    }
    const slot = `${tk.sport}.${tk.kind}`;
    bandTables.set(slot, [...(bandTables.get(slot) ?? []), conflict]);
  }
  return { thresholds, bandTables };
};
