/**
 * In-Memory ExportLedger Repository
 *
 * Test implementation keyed by the natural key
 * `[kaiordRecordId+destinationBridgeId]`, mirroring the Dexie repository:
 * `insertPending` reports a constraint on a taken key, `mutateByKey` applies
 * the shared `resolveLedgerMutation` rule (stamps `updatedAt` only on a real
 * change), and `rollbackPending` removes only a still-pending row.
 */
import type { ExportLedgerRepository } from "../application/export/export-ledger-repository.port";
import {
  type ExportLedgerEntry,
  resolveLedgerMutation,
} from "../types/export-ledger";

const keyOf = (row: { kaiordRecordId: string; destinationBridgeId: string }) =>
  `${row.kaiordRecordId}\u0000${row.destinationBridgeId}`;

export function createInMemoryExportLedgerRepository(
  store: Map<string, ExportLedgerEntry> = new Map()
): ExportLedgerRepository & { store: Map<string, ExportLedgerEntry> } {
  return {
    store,
    findByNaturalKey: async (key) => store.get(keyOf(key)),
    insertPending: async (entry) => {
      if (store.has(keyOf(entry))) return { ok: false, reason: "constraint" };
      store.set(keyOf(entry), entry);
      return { ok: true };
    },
    mutateByKey: async (key, fn) => {
      const current = store.get(keyOf(key));
      const next = resolveLedgerMutation(current, fn, new Date().toISOString());
      if (next) store.set(keyOf(key), next);
      return next ?? current;
    },
    rollbackPending: async (id) => {
      for (const [k, row] of store) {
        if (row.id === id && row.destinationExternalId === "pending")
          store.delete(k);
      }
    },
    countByDataType: async (dataType) =>
      [...store.values()].filter((e) => e.dataType === dataType).length,
  };
}
