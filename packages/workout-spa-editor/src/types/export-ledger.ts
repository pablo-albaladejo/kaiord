import { canonicalHash, managedDataTypes } from "@kaiord/core";
import { z } from "zod";

export const exportLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  kaiordRecordId: z.string().uuid(),
  dataType: z.enum(managedDataTypes),
  destinationBridgeId: z.string().min(1),
  destinationExternalId: z.string().min(1),
  contentHash: z.string().min(1),
  exportedAt: z.iso.datetime(),
  // Cross-device merge clock, stamped on every ledger write. Optional: rows
  // written before it existed fall back to `exportedAt` (merge-row-hooks).
  updatedAt: z.iso.datetime().optional(),
});
export type ExportLedgerEntry = z.infer<typeof exportLedgerEntrySchema>;

/**
 * The `mutateByKey` write rule shared by every ExportLedgerRepository: apply
 * `fn` to the current row (`undefined` when absent) and return the row to
 * store, stamped with `updatedAt: now`, or `undefined` when there is nothing
 * to write — `fn` returned `undefined`, or returned a row deep-equal to the
 * current one (a no-op must leave the row byte-identical, clock included).
 */
export const resolveLedgerMutation = (
  current: ExportLedgerEntry | undefined,
  fn: (row: ExportLedgerEntry | undefined) => ExportLedgerEntry | undefined,
  now: string
): ExportLedgerEntry | undefined => {
  const next = fn(current && structuredClone(current));
  if (next === undefined) return undefined;
  if (current && canonicalHash(next) === canonicalHash(current))
    return undefined;
  return { ...next, updatedAt: now };
};
