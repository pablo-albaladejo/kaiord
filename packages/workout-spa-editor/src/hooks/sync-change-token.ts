/**
 * Pure change-token builder for cloud auto-push.
 *
 * Combines the total row count with the latest timestamp across the synced
 * tables, so the token advances on creates, deletes, AND in-place edits
 * (an edit bumps updatedAt/modifiedAt). ISO-8601 timestamps sort
 * chronologically as plain strings, so a lexical max is a chronological max.
 */

const TIMESTAMP_FIELDS = [
  "updatedAt",
  "modifiedAt",
  "createdAt",
  "deletedAt",
] as const;

export function buildChangeToken(
  tables: Record<string, ReadonlyArray<Record<string, unknown>>>
): string {
  let count = 0;
  let latest = "";
  for (const rows of Object.values(tables)) {
    count += rows.length;
    for (const row of rows) {
      for (const field of TIMESTAMP_FIELDS) {
        const value = row[field];
        if (typeof value === "string" && value > latest) latest = value;
      }
    }
  }
  return `${count}:${latest}`;
}
