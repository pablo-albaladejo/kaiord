/**
 * Forward migration to v39 — the usage log stays on this device and names
 * no Trace. Seeding a real v38 database with usage rows that carry the
 * `traceId` of their Trace, then opening KaiordDatabase, strips that id, and
 * the `cost: 0` an unknown price was written with, and leaves every other
 * field as it was.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { usageEventSchema } from "../../types/usage-event-schemas";
import { SCHEMAS } from "./dexie-schemas";
import { V37_STORES } from "./dexie-v37-migration";
import { V38_STORES } from "./register-kaiord-v38";

const SEED_VERSION = 38;
const SCHEMA_HEAD = 40;

const ROW = {
  id: "u-1",
  yearMonth: "2026-11",
  date: "2026-11-23",
  purpose: "chat",
  providerType: "anthropic",
  modelId: "claude-sonnet-5",
  promptTokens: 100,
  completionTokens: 20,
  tokens: 120,
  cost: 0.0004,
  costBasis: "price_table",
  priceReadOn: "2026-11-23",
  requestCount: 1,
  failedRequests: 0,
  unmeasuredRequests: 0,
  createdAt: "2026-11-23T10:00:00.000Z",
};

// Written before an unknown price went without a cost: `cost: 0` meant none.
const UNKNOWN = {
  id: "u-3",
  yearMonth: "2026-11",
  date: "2026-11-23",
  purpose: "chat",
  providerType: "openai",
  modelId: "o1",
  promptTokens: 100,
  completionTokens: 20,
  tokens: 120,
  costBasis: "unknown",
  requestCount: 1,
  failedRequests: 0,
  unmeasuredRequests: 0,
  createdAt: "2026-11-23T10:00:00.000Z",
};

const seedV38 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older
    .version(SEED_VERSION)
    .stores({ ...SCHEMAS.v35, ...V37_STORES, ...V38_STORES });
  await older.open();
  await older.table("usageEvents").bulkAdd([
    { ...ROW, traceId: "trace-1" },
    { ...ROW, id: "u-2" },
    { ...UNKNOWN, cost: 0 },
  ]);
  older.close();
};

describe("Dexie usage log without Trace ids (v39) migration", () => {
  const db = sharedKaiordDatabase("v39");

  it("should strip the Trace id, and the zero cost of an unknown price, from every stored usage row", async () => {
    // Arrange
    await seedV38(db.name);

    // Act
    await db.open();
    const version = db.verno;
    const rows = await db.table("usageEvents").orderBy("id").toArray();
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
    expect(rows).toStrictEqual([ROW, { ...ROW, id: "u-2" }, UNKNOWN]);
    expect(rows.every((r) => usageEventSchema.safeParse(r).success)).toBe(true);
  });
});
