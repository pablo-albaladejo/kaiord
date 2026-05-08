/**
 * v10 → v11 migration — `SessionMatch.source` rename.
 *
 * Rewrites every `sessionMatches` row whose `source` is the legacy
 * `"auto-conversion"` value to the canonical `"auto-coaching"`. The
 * v10-migration source (`"auto-coaching-v10-migration"`) and `"manual"`
 * / `"auto-suggestion"` rows are left untouched.
 *
 * Idempotent: a re-run sees no `"auto-conversion"` rows and writes
 * nothing.
 */
import type { Transaction } from "dexie";

type MatchRow = { id: string; source: string };

export const applyV11Upgrade = async (tx: Transaction): Promise<void> => {
  await tx
    .table("sessionMatches")
    .toCollection()
    .modify((row: MatchRow) => {
      if (row.source === "auto-conversion") {
        row.source = "auto-coaching";
      }
    });
};
