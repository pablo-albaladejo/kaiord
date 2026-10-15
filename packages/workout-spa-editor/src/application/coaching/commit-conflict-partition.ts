import type { ConflictDecision, FieldKey } from "../../types/coaching-zones";
import { tableKeyOfField } from "./sync-zones-snapshot";

/** Splits the dialog's decisions into threshold keys and per-table band keys. */
export const partitionDecisions = (
  decisions: Record<FieldKey, ConflictDecision>
): {
  thresholdKeys: FieldKey[];
  bandTableKeys: Map<string, FieldKey[]>;
} => {
  const thresholdKeys: FieldKey[] = [];
  const bandTableKeys = new Map<string, FieldKey[]>();
  for (const key of Object.keys(decisions) as FieldKey[]) {
    const tk = tableKeyOfField(key);
    if (!tk) {
      thresholdKeys.push(key);
      continue;
    }
    const slot = `${tk.sport}.${tk.kind}`;
    let entry = bandTableKeys.get(slot);
    if (!entry) {
      entry = [];
      bandTableKeys.set(slot, entry);
    }
    entry.push(key);
  }
  return { thresholdKeys, bandTableKeys };
};
