/**
 * Forward migration v7 → v8 — AI provider insertion-order index.
 *
 * Existing aiProviders rows MUST gain a `createdAt: number` field so
 * `getAll()` can `orderBy("createdAt")`. The exact value for legacy
 * rows is undefined (they predate the field), but it MUST be a number
 * and MUST sort all legacy rows strictly before any post-upgrade
 * insertion.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  KaiordDatabase,
  makeBackfillAiProviderCreatedAt,
} from "./dexie-database";

const dbName = (suffix: string) => `kaiord-test-v8-${suffix}-${Date.now()}`;

const seedV7 = async (name: string): Promise<void> => {
  const v7 = new Dexie(name);
  v7.version(1).stores({ aiProviders: "id" });
  v7.version(7).stores({ aiProviders: "id" });
  await v7.open();
  await v7.table("aiProviders").bulkPut([
    {
      id: "legacy-anthropic",
      type: "anthropic",
      apiKey: "ciphertext-1",
      model: "claude-sonnet-4-5",
      label: "Legacy Claude",
      isDefault: true,
    },
    {
      id: "legacy-openai",
      type: "openai",
      apiKey: "ciphertext-2",
      model: "gpt-4o",
      label: "Legacy GPT",
      isDefault: false,
    },
  ]);
  v7.close();
};

describe("Dexie v7 → v8 migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("backfill");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("backfills createdAt as a number on every legacy aiProvider row", async () => {
    await seedV7(name);

    const v8 = new KaiordDatabase(name);
    await v8.open();
    const rows = await v8.table("aiProviders").toArray();
    v8.close();

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(typeof row.createdAt).toBe("number");
      expect(Number.isFinite(row.createdAt)).toBe(true);
    }
  });

  it("preserves all pre-existing fields verbatim", async () => {
    await seedV7(name);

    const v8 = new KaiordDatabase(name);
    await v8.open();
    const claude = await v8.table("aiProviders").get("legacy-anthropic");
    v8.close();

    expect(claude).toMatchObject({
      id: "legacy-anthropic",
      type: "anthropic",
      apiKey: "ciphertext-1",
      model: "claude-sonnet-4-5",
      label: "Legacy Claude",
      isDefault: true,
    });
  });

  it("orders legacy rows before any post-upgrade insertion via the new index", async () => {
    await seedV7(name);

    const v8 = new KaiordDatabase(name);
    await v8.open();
    // Insert a fresh row with a stamp strictly newer than any backfilled
    // legacy row could have received during open().
    await v8.table("aiProviders").put({
      id: "fresh",
      type: "google",
      apiKey: "ciphertext-fresh",
      model: "gemini-2.0",
      label: "Fresh",
      isDefault: false,
      createdAt: Date.now() + 60_000,
    });
    const ordered = await v8
      .table("aiProviders")
      .orderBy("createdAt")
      .toArray();
    v8.close();

    expect(ordered.map((r) => r.id).slice(-1)).toEqual(["fresh"]);
  });
});

describe("makeBackfillAiProviderCreatedAt", () => {
  it("stamps the supplied timestamp on a row missing createdAt", () => {
    const row: Record<string, unknown> = { id: "p1" };

    makeBackfillAiProviderCreatedAt(1_700_000_000_000)(row);

    expect(row.createdAt).toBe(1_700_000_000_000);
  });

  it("preserves an existing numeric createdAt", () => {
    const row: Record<string, unknown> = { id: "p1", createdAt: 42 };

    makeBackfillAiProviderCreatedAt(1_700_000_000_000)(row);

    expect(row.createdAt).toBe(42);
  });
});
