/**
 * v36 — Garmin calendar placement: every existing Garmin workout ledger row
 * goes through `normalizeGarminLedgerRow` once, which derives its explicit
 * `library` state from the legacy `destinationExternalId` and drops any
 * invalid Garmin part. Rows of other destinations and data types are left
 * untouched. `updatedAt` is not stamped: the normalization is shape-based
 * and every device reaches the same row on its own, so it must not win a
 * merge against a real write.
 */
import type { Transaction } from "dexie";

import { normalizeGarminLedgerRow } from "../../application/export/normalize-garmin-ledger-row";

type Row = Record<string, unknown>;

export const applyV36Upgrade = async (tx: Transaction): Promise<void> => {
  await tx
    .table("exportLedger")
    .toCollection()
    .modify((row: Row, ref: { value: Row }) => {
      const next = normalizeGarminLedgerRow(row);
      if (next !== row) ref.value = next;
    });
};
