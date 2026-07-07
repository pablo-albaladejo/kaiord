/**
 * Forward migration v16 → v17 — integrationPolicies + exportLedger stores,
 * health-store provenance fields, syncZones → IntegrationPolicy backfill.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v17-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_V16 = 16;
// Current head version KaiordDatabase opens at; later versions add stores
// (v24 connections, v25 chat conversations, v26 energy-balance), so a seeded
// db lands at head.
const SCHEMA_HEAD = 31;
const STORES_V16 = {
  profiles: "id",
  linkedAccounts: "id",
  healthSleep: "id, profileId, [profileId+date], date",
  healthWeight: "id, profileId, [profileId+date], date",
  healthHrv: "id, profileId, [profileId+date], date",
  healthDaily: "id, profileId, [profileId+date], date",
  healthBodyComposition: "id, profileId, [profileId+date], date",
  healthStress: "id, profileId, [profileId+date], date",
} as const;

const HEALTH_STORES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
] as const;

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const SAMPLE_DATE = "2026-05-20";

const seedV16 = async (
  name: string,
  opts: {
    healthRows?: ReadonlyArray<Record<string, unknown>>;
    profiles?: ReadonlyArray<Record<string, unknown>>;
  } = {}
): Promise<void> => {
  const v16 = new Dexie(name);
  v16.version(SCHEMA_V16).stores(STORES_V16);
  await v16.open();
  if (opts.profiles && opts.profiles.length > 0) {
    await v16.table("profiles").bulkAdd([...opts.profiles]);
  }
  if (opts.healthRows && opts.healthRows.length > 0) {
    await v16.table("healthSleep").bulkAdd([...opts.healthRows]);
  }
  v16.close();
};

describe("Dexie v16 → v17 migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump database schema to the current head version", async () => {
    // Arrange
    await seedV16(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create integrationPolicies store with the expected indices", async () => {
    // Arrange
    await seedV16(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const policy = {
      id: crypto.randomUUID(),
      profileId: PROFILE_ID,
      dataType: "training-zones",
      bridgeId: "train2go-bridge",
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: new Date().toISOString(),
    };
    await db.table("integrationPolicies").add(policy);
    const retrieved = await db.table("integrationPolicies").get(policy.id);
    db.close();

    // Assert
    expect(retrieved).toMatchObject({
      profileId: PROFILE_ID,
      dataType: "training-zones",
    });
  });

  it("should create exportLedger store with the unique kaiordRecordId+destinationBridgeId index", async () => {
    // Arrange
    await seedV16(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const entry = {
      id: crypto.randomUUID(),
      kaiordRecordId: crypto.randomUUID(),
      dataType: "health-sleep",
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: "ext-1",
      contentHash: "abc123",
      exportedAt: new Date().toISOString(),
    };
    await db.table("exportLedger").add(entry);
    const retrieved = await db.table("exportLedger").get(entry.id);
    db.close();

    // Assert
    expect(retrieved).toMatchObject({ kaiordRecordId: entry.kaiordRecordId });
  });

  it("should add sourceBridgeId, externalId, and unique [profileId+sourceBridgeId+externalId] index to each health store", async () => {
    // Arrange
    await seedV16(name);
    const db = new KaiordDatabase(name);
    await db.open();

    // Act
    const indexNamesByStore = HEALTH_STORES.map((storeName) => {
      const schema = db.table(storeName).schema;
      return schema.indexes.map((i) =>
        Array.isArray(i.keyPath) ? i.keyPath.join("+") : i.keyPath
      );
    });
    db.close();

    // Assert
    for (const indexNames of indexNamesByStore) {
      expect(indexNames).toContain("sourceBridgeId");
      expect(indexNames).toContain("externalId");
      expect(
        indexNames.some(
          (n) => n.includes("sourceBridgeId") && n.includes("externalId")
        )
      ).toBe(true);
    }
  });

  it("should backfill sourceBridgeId=manual and a derived externalId for legacy health rows", async () => {
    // Arrange
    await seedV16(name, {
      healthRows: [
        { id: "r-1", profileId: PROFILE_ID, date: SAMPLE_DATE, value: 7.5 },
      ],
    });

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const row = (await db.table("healthSleep").get("r-1")) as
      Record<string, unknown> | undefined;
    db.close();

    // Assert
    expect(row?.sourceBridgeId).toBe("manual");
    expect(typeof row?.externalId).toBe("string");
    expect((row?.externalId as string).startsWith("k1:")).toBe(true);
    expect(typeof row?.kaiordRecordId).toBe("string");
  });

  it("should be a no-op when run a second time on an already-migrated database", async () => {
    // Arrange
    await seedV16(name, {
      healthRows: [
        { id: "r-1", profileId: PROFILE_ID, date: SAMPLE_DATE, value: 7.5 },
      ],
    });
    const db1 = new KaiordDatabase(name);
    await db1.open();
    const row1 = (await db1.table("healthSleep").get("r-1")) as Record<
      string,
      unknown
    >;
    db1.close();

    // Act
    const db2 = new KaiordDatabase(name);
    await db2.open();
    const row2 = (await db2.table("healthSleep").get("r-1")) as Record<
      string,
      unknown
    >;
    db2.close();

    // Assert
    expect(row2?.externalId).toBe(row1?.externalId);
    expect(row2?.kaiordRecordId).toBe(row1?.kaiordRecordId);
  });

  it("should create an IntegrationPolicy for every linkedAccount with syncZones=true", async () => {
    // Arrange
    await seedV16(name, {
      profiles: [
        {
          id: PROFILE_ID,
          linkedAccounts: [{ source: "train2go", syncZones: true }],
        },
      ],
    });

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const policies = await db
      .table("integrationPolicies")
      .where("profileId")
      .equals(PROFILE_ID)
      .toArray();
    db.close();

    // Assert
    // v28 also seeds a planned-session import policy for this train2go-linked
    // profile, so scope the assertion to the v17 training-zones policy.
    const zones = policies.filter((p) => p.dataType === "training-zones");
    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({
      profileId: PROFILE_ID,
      dataType: "training-zones",
      direction: "import",
      bridgeId: "train2go-bridge",
      mode: "auto",
      enabled: true,
    });
  });

  it("should NOT duplicate IntegrationPolicy rows on re-run", async () => {
    // Arrange
    await seedV16(name, {
      profiles: [
        {
          id: PROFILE_ID,
          linkedAccounts: [{ source: "train2go", syncZones: true }],
        },
      ],
    });
    const db1 = new KaiordDatabase(name);
    await db1.open();
    db1.close();

    // Act
    const db2 = new KaiordDatabase(name);
    await db2.open();
    const policies = await db2
      .table("integrationPolicies")
      .where("profileId")
      .equals(PROFILE_ID)
      .toArray();
    db2.close();

    // Assert
    // Scope to the v17 training-zones policy (v28 adds a planned-session one).
    const zones = policies.filter((p) => p.dataType === "training-zones");
    expect(zones).toHaveLength(1);
  });

  it("should retain syncZones column on linkedAccounts as a rollback buffer", async () => {
    // Arrange
    await seedV16(name, {
      profiles: [
        {
          id: PROFILE_ID,
          linkedAccounts: [{ source: "train2go", syncZones: true }],
        },
      ],
    });

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const profile = (await db.table("profiles").get(PROFILE_ID)) as {
      linkedAccounts?: Array<{ source: string; syncZones?: boolean }>;
    };
    db.close();

    // Assert
    expect(profile?.linkedAccounts?.[0]?.syncZones).toBe(true);
  });

  it("should surface QuotaExceededError via the error callback and leave partial backfill in place", async () => {
    // Arrange
    await seedV16(name, {
      healthRows: [
        { id: "r-1", profileId: PROFILE_ID, date: SAMPLE_DATE, value: 7.5 },
      ],
    });
    const errors: unknown[] = [];
    const { backfillHealthProvenance } =
      await import("./dexie-v17-provenance-backfill");
    const rawDb = new Dexie(name);
    rawDb.version(SCHEMA_V16).stores({
      healthSleep: "id, profileId, [profileId+date], date",
    });
    await rawDb.open();

    // Act
    await rawDb.transaction("rw", ["healthSleep"], async (tx) => {
      const quotaError = Object.assign(new Error("quota"), {
        name: "QuotaExceededError",
      });
      const origBulkPut = tx
        .table("healthSleep")
        .bulkPut.bind(tx.table("healthSleep"));
      (tx.table("healthSleep") as Record<string, unknown>)["bulkPut"] =
        async () => {
          throw quotaError;
        };
      await backfillHealthProvenance(tx, (err) => errors.push(err));
      (tx.table("healthSleep") as Record<string, unknown>)["bulkPut"] =
        origBulkPut;
    });
    rawDb.close();

    // Assert
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).name).toBe("QuotaExceededError");
  });
});
