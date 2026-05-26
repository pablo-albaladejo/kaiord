/**
 * Unit tests for backfillHealthProvenance.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { backfillHealthProvenance } from "./dexie-v17-provenance-backfill";

const dbName = (suffix: string) =>
  `kaiord-test-v17-prov-${suffix}-${Date.now()}-${Math.random()}`;

const STORES = {
  healthSleep:
    "id, profileId, [profileId+date], date, sourceBridgeId, externalId, [profileId+sourceBridgeId+externalId]",
} as const;

const PROFILE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("backfillHealthProvenance", () => {
  let name: string;
  let db: Dexie;

  beforeEach(() => {
    name = dbName("apply");
    db = new Dexie(name);
    db.version(1).stores(STORES);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should stamp sourceBridgeId=manual and externalId on rows without externalId", async () => {
    // Arrange
    await db.open();
    await db
      .table("healthSleep")
      .add({ id: "r-1", profileId: PROFILE_ID, date: "2026-01-01", value: 7 });

    // Act
    let result!: { stamped: number; skipped: number };
    await db.transaction("rw", ["healthSleep"], async (tx) => {
      result = await backfillHealthProvenance(tx);
    });

    // Assert
    const row = (await db.table("healthSleep").get("r-1")) as Record<
      string,
      unknown
    >;
    expect(row.sourceBridgeId).toBe("manual");
    expect(typeof row.externalId).toBe("string");
    expect((row.externalId as string).startsWith("k1:")).toBe(true);
    expect(result.stamped).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it("should skip rows that already have externalId", async () => {
    // Arrange
    await db.open();
    await db.table("healthSleep").add({
      id: "r-2",
      profileId: PROFILE_ID,
      date: "2026-01-02",
      sourceBridgeId: "garmin-bridge",
      externalId: "k1:existing",
    });

    // Act
    let result!: { stamped: number; skipped: number };
    await db.transaction("rw", ["healthSleep"], async (tx) => {
      result = await backfillHealthProvenance(tx);
    });

    // Assert
    const row = (await db.table("healthSleep").get("r-2")) as Record<
      string,
      unknown
    >;
    expect(row.externalId).toBe("k1:existing");
    expect(result.skipped).toBe(1);
    expect(result.stamped).toBe(0);
  });

  it("should be idempotent on a second run", async () => {
    // Arrange
    await db.open();
    await db
      .table("healthSleep")
      .add({ id: "r-3", profileId: PROFILE_ID, date: "2026-01-03", value: 8 });

    // Act
    await db.transaction("rw", ["healthSleep"], async (tx) => {
      await backfillHealthProvenance(tx);
    });
    const first = (await db.table("healthSleep").get("r-3")) as Record<
      string,
      unknown
    >;
    await db.transaction("rw", ["healthSleep"], async (tx) => {
      await backfillHealthProvenance(tx);
    });
    const second = (await db.table("healthSleep").get("r-3")) as Record<
      string,
      unknown
    >;

    // Assert
    expect(second.externalId).toBe(first.externalId);
    expect(second.kaiordRecordId).toBe(first.kaiordRecordId);
  });

  it("should call the error callback on QuotaExceededError and not throw", async () => {
    // Arrange
    await db.open();
    await db
      .table("healthSleep")
      .add({ id: "r-4", profileId: PROFILE_ID, date: "2026-01-04", value: 6 });
    const errors: unknown[] = [];

    // Act
    await db.transaction("rw", ["healthSleep"], async (tx) => {
      const quotaError = Object.assign(new Error("quota"), {
        name: "QuotaExceededError",
      });
      (tx.table("healthSleep") as Record<string, unknown>)["bulkPut"] =
        async () => {
          throw quotaError;
        };
      await backfillHealthProvenance(tx, (err) => errors.push(err));
    });

    // Assert
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).name).toBe("QuotaExceededError");
  });
});
