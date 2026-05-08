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
import {
  LEGACY_USAGE_LARGE_TOKEN_TOTAL,
  LEGACY_USAGE_SMALL_TOKEN_TOTAL,
} from "./dexie-usage-migration.test-fixtures";

describe("backfillUsageRow (unit)", () => {
  it("should fill inputTokens from totalTokens and set outputTokens=0, legacy=true", () => {
    // Arrange
    const row: Record<string, unknown> = {
      yearMonth: "2026-03",
      totalTokens: 500,
      totalCost: 0.01,
      entries: [{ date: "2026-03-12", tokens: 500, cost: 0.01 }],
    };

    // Act
    backfillUsageRow(row);

    // Assert
    expect(row.inputTokens).toBe(500);
    expect(row.outputTokens).toBe(0);
    expect(row.legacy).toBe(true);
    expect(row.totalTokens).toBe(500);
  });

  it("should backfill every entry alongside the record-level fields", () => {
    // Arrange
    const row: Record<string, unknown> = {
      yearMonth: "2026-03",
      totalTokens: LEGACY_USAGE_SMALL_TOKEN_TOTAL,
      totalCost: 0.001,
      entries: [
        {
          date: "2026-03-12",
          tokens: LEGACY_USAGE_SMALL_TOKEN_TOTAL,
          cost: 0.001,
        },
      ],
    };
    backfillUsageRow(row);

    // Act
    const entry = (row.entries as Array<Record<string, unknown>>)[0];

    // Assert
    expect(entry.inputTokens).toBe(LEGACY_USAGE_SMALL_TOKEN_TOTAL);
    expect(entry.outputTokens).toBe(0);
    expect(entry.tokens).toBe(LEGACY_USAGE_SMALL_TOKEN_TOTAL);
  });

  it("should be idempotent — rows already carrying inputTokens are untouched", () => {
    // Arrange
    const row: Record<string, unknown> = {
      yearMonth: "2026-04",
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
      totalCost: 0.02,
      entries: [],
    };
    const before = JSON.stringify(row);

    // Act
    backfillUsageRow(row);

    // Assert
    expect(JSON.stringify(row)).toBe(before);
  });

  it("should handle rows missing totalTokens gracefully", () => {
    // Arrange
    const row: Record<string, unknown> = {
      yearMonth: "2026-02",
      totalCost: 0,
      entries: [],
    };

    // Act
    backfillUsageRow(row);

    // Assert
    expect(row.inputTokens).toBe(0);
    expect(row.outputTokens).toBe(0);
    expect(row.legacy).toBe(true);
  });
});

describe("Dexie v2 → v3 upgrade (integration)", () => {
  it("should migrate legacy usage rows in-place on open", async () => {
    // Arrange
    const dbName = `kaiord-usage-migration-${Date.now()}-${Math.random()}`;
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
      totalTokens: LEGACY_USAGE_LARGE_TOKEN_TOTAL,
      totalCost: 0.015,
      entries: [
        {
          date: "2026-03-12",
          tokens: LEGACY_USAGE_LARGE_TOKEN_TOTAL,
          cost: 0.015,
        },
      ],
    });
    v2.close();
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
    expect(migrated!.inputTokens).toBe(LEGACY_USAGE_LARGE_TOKEN_TOTAL);
    expect(migrated!.outputTokens).toBe(0);
    expect(migrated!.totalTokens).toBe(LEGACY_USAGE_LARGE_TOKEN_TOTAL);
    expect(migrated!.legacy).toBe(true);
    expect(migrated!.entries[0].inputTokens).toBe(
      LEGACY_USAGE_LARGE_TOKEN_TOTAL
    );
    expect(migrated!.entries[0].outputTokens).toBe(0);

    // Act
    v3.close();

    // Assert
  });
});
