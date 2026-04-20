/**
 * Dexie v2 → v3 migration: backfill `inputTokens` / `outputTokens`
 * on legacy `usage` rows that only had `totalTokens`.
 *
 * Exercises both:
 *   1. The pure `backfillUsageRow` helper (unit).
 *   2. The full Dexie upgrade hook end-to-end (integration): seed
 *      a v2-shape database, open it at v3, and verify migrated
 *      rows.
 */

import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import { backfillUsageRow, KaiordDatabase } from "./dexie-database";

describe("backfillUsageRow (unit)", () => {
  it("fills inputTokens from totalTokens and sets outputTokens=0, legacy=true", () => {
    const row: Record<string, unknown> = {
      yearMonth: "2026-03",
      totalTokens: 500,
      totalCost: 0.01,
      entries: [{ date: "2026-03-12", tokens: 500, cost: 0.01 }],
    };

    backfillUsageRow(row);

    expect(row.inputTokens).toBe(500);
    expect(row.outputTokens).toBe(0);
    expect(row.legacy).toBe(true);
    expect(row.totalTokens).toBe(500);
  });

  it("backfills every entry alongside the record-level fields", () => {
    const row: Record<string, unknown> = {
      yearMonth: "2026-03",
      totalTokens: 80,
      totalCost: 0.001,
      entries: [{ date: "2026-03-12", tokens: 80, cost: 0.001 }],
    };

    backfillUsageRow(row);

    const entry = (row.entries as Array<Record<string, unknown>>)[0];
    expect(entry.inputTokens).toBe(80);
    expect(entry.outputTokens).toBe(0);
    expect(entry.tokens).toBe(80);
  });

  it("is idempotent — rows already carrying inputTokens are untouched", () => {
    const row: Record<string, unknown> = {
      yearMonth: "2026-04",
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
      totalCost: 0.02,
      entries: [],
    };

    const before = JSON.stringify(row);
    backfillUsageRow(row);

    expect(JSON.stringify(row)).toBe(before);
  });

  it("handles rows missing totalTokens gracefully", () => {
    const row: Record<string, unknown> = {
      yearMonth: "2026-02",
      totalCost: 0,
      entries: [],
    };

    backfillUsageRow(row);

    expect(row.inputTokens).toBe(0);
    expect(row.outputTokens).toBe(0);
    expect(row.legacy).toBe(true);
  });
});

describe("Dexie v2 → v3 upgrade (integration)", () => {
  it("migrates legacy usage rows in-place on open", async () => {
    const dbName = `kaiord-usage-migration-${Date.now()}-${Math.random()}`;

    // Seed a v2-shape database directly (no `inputTokens` field).
    const v2 = new Dexie(dbName);
    v2.version(2).stores({
      workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
      templates: "id, sport, *tags",
      profiles: "id",
      aiProviders: "id",
      syncState: "source",
      usage: "yearMonth",
      meta: "key",
      bridges: "extensionId, status, lastSeen",
    });
    await v2.open();
    await v2.table("usage").put({
      yearMonth: "2026-03",
      totalTokens: 750,
      totalCost: 0.015,
      entries: [{ date: "2026-03-12", tokens: 750, cost: 0.015 }],
    });
    v2.close();

    // Open via the current KaiordDatabase (version 3) — triggers upgrade.
    const v3 = new KaiordDatabase(dbName);
    await v3.open();
    const migrated = await v3
      .table<{
        yearMonth: string;
        totalTokens: number;
        inputTokens: number;
        outputTokens: number;
        legacy?: boolean;
        entries: Array<Record<string, unknown>>;
      }>("usage")
      .get("2026-03");

    expect(migrated).toBeDefined();
    expect(migrated!.inputTokens).toBe(750);
    expect(migrated!.outputTokens).toBe(0);
    expect(migrated!.totalTokens).toBe(750);
    expect(migrated!.legacy).toBe(true);
    expect(migrated!.entries[0].inputTokens).toBe(750);
    expect(migrated!.entries[0].outputTokens).toBe(0);

    v3.close();
  });
});
