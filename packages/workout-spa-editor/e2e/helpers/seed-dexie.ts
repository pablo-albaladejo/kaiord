/**
 * Dexie seeding and utility helpers for E2E tests.
 *
 * IMPORTANT: All seed* / clear functions must be called
 * AFTER page.goto() — the DB is only initialised once the app JS runs.
 */

import type { Page } from "@playwright/test";

export { makeRawWorkout, makeTemplate, makeWorkout } from "./dexie-factories";

type DexieDb = {
  table: (n: string) => {
    bulkPut: (r: unknown[]) => Promise<void>;
    clear: () => Promise<void>;
  };
};

/** Seed workouts into Dexie. Call AFTER page.goto(). */
export async function seedWorkouts(
  page: Page,
  workouts: Record<string, unknown>[]
) {
  await page.evaluate(async (records) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as
      | DexieDb
      | undefined;
    if (!db) throw new Error("__KAIORD_DB__ not available");
    await db.table("workouts").bulkPut(records);
  }, workouts);
}

/** Seed templates into Dexie. Call AFTER page.goto(). */
export async function seedTemplates(
  page: Page,
  templates: Record<string, unknown>[]
) {
  await page.evaluate(async (records) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as
      | DexieDb
      | undefined;
    if (!db) throw new Error("__KAIORD_DB__ not available");
    await db.table("templates").bulkPut(records);
  }, templates);
}

/** Clear all Dexie tables. */
export async function clearDexie(page: Page) {
  await page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as
      | DexieDb
      | undefined;
    if (!db) return;
    const tables = [
      "workouts",
      "templates",
      "profiles",
      "aiProviders",
      "syncState",
      "usage",
      "meta",
    ];
    await Promise.all(tables.map((t) => db.table(t).clear()));
  });
}

/** Get ISO date strings (Mon-Sun) for a week offset from now. */
export function getWeekDates(weekOffset = 0): string[] {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/** Get ISO week ID (e.g. "2026-W15") for a date string. */
export function getWeekId(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const t = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t.getTime() - y.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, "0")}`;
}
