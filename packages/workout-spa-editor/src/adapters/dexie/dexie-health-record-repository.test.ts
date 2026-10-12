/**
 * Generic Dexie health-record repository contract tests. Mirrors the
 * in-memory contract so the two implementations stay observationally
 * equivalent. Runs against fake-indexeddb so no real IDB is required.
 */
import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import type { HealthSleepRecord } from "../../types/health/health-records";
import { createDexieHealthRecordRepository } from "./dexie-health-record-repository";

const TABLE = "healthSleep" as const;
const PROFILE_A = "p-A";
const PROFILE_B = "p-B";

const seed = (
  id: string,
  profileId: string,
  date: string
): HealthSleepRecord => ({
  id,
  profileId,
  date,
  krd: {
    kind: "sleep",
    version: "2.0",
    startTime: `${date}T22:00:00.000Z`,
    endTime: `${date}T23:00:00.000Z`,
    stages: [],
  } as unknown as HealthSleepRecord["krd"],
});

describe("createDexieHealthRecordRepository (against healthSleep)", () => {
  const db = sharedKaiordDatabase("health-records");

  beforeEach(async () => {
    await db.open();
  });

  it("should round-trip put + getById", async () => {
    // Arrange
    const repo = createDexieHealthRecordRepository<HealthSleepRecord>(
      db,
      TABLE
    );
    const record = seed("r-1", PROFILE_A, "2026-05-23");

    // Act
    await repo.put(record);
    const fetched = await repo.getById("r-1");

    // Assert
    expect(fetched?.id).toBe("r-1");
    expect(fetched?.profileId).toBe(PROFILE_A);
  });

  it("should range-query by [profileId+date] inclusively", async () => {
    // Arrange
    const repo = createDexieHealthRecordRepository<HealthSleepRecord>(
      db,
      TABLE
    );
    await repo.upsertMany([
      seed("a", PROFILE_A, "2026-05-20"),
      seed("b", PROFILE_A, "2026-05-22"),
      seed("c", PROFILE_A, "2026-05-25"),
      seed("d", PROFILE_B, "2026-05-22"),
    ]);

    // Act
    const rows = await repo.getByProfileAndDateRange(
      PROFILE_A,
      "2026-05-21",
      "2026-05-23"
    );

    // Assert
    expect(rows.map((r) => r.id)).toEqual(["b"]);
  });

  it("should cascade deleteByProfile across rows of the given profile only", async () => {
    // Arrange
    const repo = createDexieHealthRecordRepository<HealthSleepRecord>(
      db,
      TABLE
    );
    await repo.upsertMany([
      seed("a", PROFILE_A, "2026-05-23"),
      seed("b", PROFILE_B, "2026-05-23"),
    ]);

    // Act
    await repo.deleteByProfile(PROFILE_A);
    const remaining = await db.table(TABLE).toArray();

    // Assert
    expect(remaining.map((r) => r.id)).toEqual(["b"]);
  });
});
