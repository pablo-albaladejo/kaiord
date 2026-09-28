/**
 * commitByKey — record a successful POST on the ledger row that holds the
 * export's natural key `[kaiordRecordId+destinationBridgeId]`, whatever its
 * ledger id.
 *
 * Between the pending insert and the POST resolving, a cloud sync may replace
 * this device's row with another device's winning row for the same key, or
 * the row may be deleted. Addressing the commit by ledger id would then be a
 * silent no-op that drops the id the destination just assigned. Instead:
 * - the row for the key exists (any id) → patch it with this export's
 *   destination id, content hash and export time; the fresh commit is the
 *   newest truth. The destination id it overwrites is left as an UNTRACKED
 *   DUPLICATE on the destination — the accepted residual: a duplicate is
 *   recoverable, a gap (a pushed record the ledger forgot) is not.
 * - no row holds the key → re-insert `base`, keeping its ledger id.
 *
 * Resolves to the surviving row's ledger id.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { ExportLedgerRepository } from "./export-ledger-repository.port";

export type CommitPatch = Pick<
  ExportLedgerEntry,
  "destinationExternalId" | "contentHash" | "exportedAt"
>;

export const commitByKey = async (
  ledgerRepo: ExportLedgerRepository,
  base: ExportLedgerEntry,
  patch: CommitPatch
): Promise<string> => {
  const { kaiordRecordId, destinationBridgeId } = base;
  const row = await ledgerRepo.mutateByKey(
    { kaiordRecordId, destinationBridgeId },
    (current) => ({ ...(current ?? base), ...patch })
  );
  return row?.id ?? base.id;
};
