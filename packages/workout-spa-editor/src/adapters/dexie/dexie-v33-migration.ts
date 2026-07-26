/**
 * v33 — usage-accounting cutover: fold the legacy monthly `usage` store into
 * the `usageEvents` log, THEN drop `usage` (declared `usage: null` in the v33
 * schema). One migrated event per `usage.entries[]` element: `purpose:"chat"`,
 * no `providerType`, the already-computed `cost`/`date` carried over, and a
 * deterministic id `usage-migrated:<yearMonth>:<i>` so a re-applied upgrade is a
 * no-op (bulkPut over identical ids). Dexie runs this callback while the
 * to-be-deleted `usage` table is still readable, deleting the store only after
 * (see dexie.mjs updateTablesAndIndexes: contentUpgrade → deleteRemovedTables).
 */
import type { Transaction } from "dexie";

type UsageEntry = {
  date?: string;
  inputTokens?: number;
  outputTokens?: number;
  tokens?: number;
  cost?: number;
};

type UsageRow = {
  yearMonth: string;
  entries?: UsageEntry[];
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  totalCost?: number;
};

const migratedEvent = (
  row: UsageRow,
  entry: UsageEntry,
  index: number
): Record<string, unknown> => {
  const promptTokens = entry.inputTokens ?? entry.tokens ?? 0;
  const completionTokens = entry.outputTokens ?? 0;
  const date = entry.date ?? `${row.yearMonth}-01`;
  return {
    id: `usage-migrated:${row.yearMonth}:${index}`,
    yearMonth: row.yearMonth,
    date,
    purpose: "chat",
    promptTokens,
    completionTokens,
    tokens: entry.tokens ?? promptTokens + completionTokens,
    cost: entry.cost ?? 0,
    createdAt: `${date}T00:00:00.000Z`,
  };
};

// Entry-less legacy/backfilled rows (aggregate totals, no `entries[]`) still
// carry a month's history — preserve it as one aggregate event rather than
// dropping it. Rows with entries migrate per-entry as before.
const eventsForRow = (row: UsageRow): Record<string, unknown>[] => {
  const entries = row.entries ?? [];
  if (entries.length > 0)
    return entries.map((entry, index) => migratedEvent(row, entry, index));
  const inputTokens = row.inputTokens ?? 0;
  const outputTokens = row.outputTokens ?? 0;
  if (inputTokens + outputTokens === 0) return [];
  const aggregate: UsageEntry = {
    date: `${row.yearMonth}-01`,
    inputTokens,
    outputTokens,
    tokens: row.totalTokens ?? inputTokens + outputTokens,
    cost: row.totalCost ?? 0,
  };
  return [migratedEvent(row, aggregate, 0)];
};

export const applyV33Upgrade = async (tx: Transaction): Promise<void> => {
  // The v32 dual-write already mirrored chat turns into `usageEvents` (purpose
  // "chat"). `usage.entries[]` is the complete, authoritative chat history, so
  // folding it in without first removing that partial mirror would double-count
  // recent-month chat tokens and cost. Drop the chat mirror, then fold; non-chat
  // events (workout_generation, lab_extraction) were never in `usage` and stay.
  await tx
    .table("usageEvents")
    .filter((e) => (e as { purpose?: string }).purpose === "chat")
    .delete();
  const rows = (await tx.table("usage").toArray()) as UsageRow[];
  const events = rows.flatMap(eventsForRow);
  if (events.length > 0) await tx.table("usageEvents").bulkPut(events);
};
