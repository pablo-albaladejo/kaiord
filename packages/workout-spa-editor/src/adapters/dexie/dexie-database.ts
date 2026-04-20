/**
 * Dexie Database Schema
 *
 * IndexedDB database definition for the workout SPA editor.
 * Uses Dexie.js class syntax (required by the library).
 */

import Dexie from "dexie";

export class KaiordDatabase extends Dexie {
  constructor(name = "kaiord-spa") {
    super(name);

    this.version(1).stores({
      workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
      templates: "id, sport, *tags",
      profiles: "id",
      aiProviders: "id",
      syncState: "source",
      usage: "yearMonth",
      meta: "key",
    });

    // v2 — bridge registry persistence so the 24h-unavailable and
    // 24h-removed lifecycle timers survive browser restarts.
    this.version(2).stores({
      workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
      templates: "id, sport, *tags",
      profiles: "id",
      aiProviders: "id",
      syncState: "source",
      usage: "yearMonth",
      meta: "key",
      bridges: "extensionId, status, lastSeen",
    });

    // v3 — UsageRecord gains `inputTokens`/`outputTokens` (split of
    // the legacy `totalTokens`). Schema keys unchanged; only the
    // row shape grows, hence no store redefinition — just an
    // `.upgrade()` backfill marking pre-v3 rows as `legacy`.
    this.version(3)
      .stores({
        workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
        templates: "id, sport, *tags",
        profiles: "id",
        aiProviders: "id",
        syncState: "source",
        usage: "yearMonth",
        meta: "key",
        bridges: "extensionId, status, lastSeen",
      })
      .upgrade(async (tx) => {
        await tx.table("usage").toCollection().modify(backfillUsageRow);
      });
  }
}

export function backfillUsageRow(row: Record<string, unknown>): void {
  if (typeof row.inputTokens === "number") return;
  const total = typeof row.totalTokens === "number" ? row.totalTokens : 0;
  row.inputTokens = total;
  row.outputTokens = 0;
  row.legacy = true;

  if (Array.isArray(row.entries)) {
    row.entries = row.entries.map((entry: Record<string, unknown>) => {
      if (typeof entry.inputTokens === "number") return entry;
      const tokens = typeof entry.tokens === "number" ? entry.tokens : 0;
      return { ...entry, inputTokens: tokens, outputTokens: 0 };
    });
  }
}

export const db = new KaiordDatabase();

// Expose for e2e test seeding (dev mode only)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__KAIORD_DB__ = db;
}
