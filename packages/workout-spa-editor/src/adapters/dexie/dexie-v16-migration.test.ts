/**
 * Forward migration v15 → v16 — six new health-domain stores.
 *
 * Seeds a raw Dexie at v15 with one userPreferences row, opens with
 * `KaiordDatabase` (which registers v16), and asserts:
 *  - the legacy v15 row survives the upgrade unchanged,
 *  - each new health store exists and accepts a write/read round-trip.
 *
 * No data migration is needed — the new stores are purely additive.
 * This test guards the additive contract rather than data behaviour.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v16-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_V15 = 15;
const SCHEMA_V16 = 16;
const STORES_V15 = {
  userPreferences: "profileId",
} as const;
// Mirrors the real v16 health-store contract (CORE_V16 in dexie-schemas-early):
// `[profileId+date], date` indexes are present from v16; the provenance suffix
// is a v17 addition and is intentionally out of scope here.
const HEALTH_STORE_SCHEMA_V16 = "id, profileId, [profileId+date], date";
const STORES_V16 = {
  ...STORES_V15,
  healthSleep: HEALTH_STORE_SCHEMA_V16,
  healthWeight: HEALTH_STORE_SCHEMA_V16,
  healthHrv: HEALTH_STORE_SCHEMA_V16,
  healthDaily: HEALTH_STORE_SCHEMA_V16,
  healthBodyComposition: HEALTH_STORE_SCHEMA_V16,
  healthStress: HEALTH_STORE_SCHEMA_V16,
} as const;

const HEALTH_STORES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
] as const;

const PROFILE_ID = "p-1";
const SAMPLE_DATE = "2026-05-23";

const seedV15 = async (
  name: string,
  rows: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const v15 = new Dexie(name);
  v15.version(SCHEMA_V15).stores(STORES_V15);
  await v15.open();
  if (rows.length > 0) await v15.table("userPreferences").bulkAdd([...rows]);
  v15.close();
};

describe("Dexie v15 → v16 migration (health-domain stores)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should preserve a v15 userPreferences row untouched after upgrading to v16", async () => {
    // Arrange
    await seedV15(name, [
      {
        profileId: PROFILE_ID,
        calendarView: "grid",
        updatedAt: "2026-05-08T10:00:00.000Z",
      },
    ]);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const row = (await db.table("userPreferences").get(PROFILE_ID)) as
      | { calendarView?: string }
      | undefined;
    db.close();

    // Assert
    expect(row?.calendarView).toBe("grid");
  });

  it.each(HEALTH_STORES)(
    "should expose the %s store after upgrade and round-trip a write",
    async (storeName) => {
      // Arrange
      await seedV15(name, []);
      const db = new KaiordDatabase(name);
      await db.open();

      // Act
      await db
        .table(storeName)
        .put({ id: "r-1", profileId: PROFILE_ID, date: SAMPLE_DATE });
      const row = (await db.table(storeName).get("r-1")) as
        | { profileId: string; date: string }
        | undefined;
      db.close();

      // Assert
      expect(row).toEqual({
        id: "r-1",
        profileId: PROFILE_ID,
        date: SAMPLE_DATE,
      });
    }
  );

  it("should leave the database at v15 when the v15→v16 upgrade aborts mid-flight", async () => {
    // Arrange
    await seedV15(name, [
      {
        profileId: PROFILE_ID,
        calendarView: "grid",
        updatedAt: "2026-05-08T10:00:00.000Z",
      },
    ]);
    const failing = new Dexie(name);
    failing.version(SCHEMA_V15).stores(STORES_V15);
    failing
      .version(SCHEMA_V16)
      .stores(STORES_V16)
      .upgrade(() => {
        throw new Error("simulated mid-flight upgrade failure");
      });

    // Act
    await expect(failing.open()).rejects.toThrow();
    failing.close();

    // Assert
    // The aborted transaction leaves the DB at v15: it still opens with only the
    // v15 schema (a committed v16 would reject as VersionError), the legacy row
    // is intact, and no health store was created.
    const reopened = new Dexie(name);
    reopened.version(SCHEMA_V15).stores(STORES_V15);
    await reopened.open();
    const verno = reopened.verno;
    const tables = reopened.tables.map((t) => t.name);
    const row = (await reopened.table("userPreferences").get(PROFILE_ID)) as
      | { calendarView?: string }
      | undefined;
    reopened.close();

    expect(verno).toBe(SCHEMA_V15);
    for (const store of HEALTH_STORES) {
      expect(tables).not.toContain(store);
    }
    expect(row?.calendarView).toBe("grid");
  });
});
