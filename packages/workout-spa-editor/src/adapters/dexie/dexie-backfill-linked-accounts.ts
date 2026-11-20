/**
 * v4 profile backfill helper.
 *
 * Used by the v4 upgrade in
 * `register-kaiord-versions.ts` to give legacy profile rows an empty
 * `linkedAccounts` array.
 */

/** Backfills `linkedAccounts: []` on profile rows missing the field. */
export const backfillLinkedAccounts = (row: Record<string, unknown>): void => {
  if (!Array.isArray(row.linkedAccounts)) row.linkedAccounts = [];
};
