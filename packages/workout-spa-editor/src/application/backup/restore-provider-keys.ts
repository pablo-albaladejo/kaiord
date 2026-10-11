/**
 * A backup carries AI providers without their `apiKey`. After the merge, each
 * provider row gets back the encrypted key this device already holds for it,
 * whichever side won the merge. A provider only the file knows arrives with
 * `apiKeyMissing: true` and no key, and stops being the default when this
 * device already has one. Runs only on a backup import: the Drive sync never
 * strips keys, so it must never resurrect one either. Pure.
 */

import type { Snapshot } from "../../types/snapshot";

type Row = Record<string, unknown>;

const TABLE = "aiProviders";

const withoutKey = (row: Row): Row =>
  Object.fromEntries(
    Object.entries(row).filter(([k]) => k !== "apiKey" && k !== "apiKeyMissing")
  );

export function restoreProviderKeys(
  merged: Snapshot,
  local: Snapshot
): Snapshot {
  const rows = (merged.tables[TABLE] ?? []) as Row[];
  if (rows.length === 0) return merged;
  const localRows = (local.tables[TABLE] ?? []) as Row[];
  const localById = new Map(localRows.map((row) => [row.id, row]));
  const localDefault = localRows.some((row) => row.isDefault === true);
  const restored = rows.map((row): Row => {
    const own = localById.get(row.id);
    if (typeof own?.apiKey === "string")
      return { ...withoutKey(row), apiKey: own.apiKey };
    return {
      ...withoutKey(row),
      apiKeyMissing: true,
      ...(!own && localDefault && { isDefault: false }),
    };
  });
  return { ...merged, tables: { ...merged.tables, [TABLE]: restored } };
}
