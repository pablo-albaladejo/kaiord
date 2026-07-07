/**
 * Forward migration to v28 — provenance backfill + partial policy seeding.
 * Seeding a v27 database and opening KaiordDatabase runs `applyV28Upgrade`:
 * legacy health rows without a source get `sourceBridgeId:"unknown"` (sourced
 * rows untouched), and Train2Go-linked profiles get a default enabled
 * planned-session import policy (existing policies are not duplicated).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v28-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_SEED = 27;
const SCHEMA_HEAD = 31;
const HEALTH_SUFFIX =
  ", sourceBridgeId, externalId, [profileId+sourceBridgeId+externalId]";
const STORES_SEED = {
  profiles: "id",
  meta: "key",
  healthSleep: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  integrationPolicies:
    "id, [profileId+dataType+direction], &[profileId+dataType+direction+bridgeId], profileId",
} as const;

const EXISTING_POLICY = {
  id: "00000000-0000-4000-8000-000000000003",
  profileId: "p-3",
  dataType: "planned-session",
  bridgeId: "train2go-bridge",
  direction: "import",
  mode: "auto",
  enabled: false,
  updatedAt: "2026-05-01T10:00:00.000Z",
};

const seed = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SCHEMA_SEED).stores(STORES_SEED);
  await older.open();
  await older.table("healthSleep").bulkAdd([
    { id: "h-legacy", profileId: "p-1", date: "2026-05-20" },
    {
      id: "h-sourced",
      profileId: "p-1",
      date: "2026-05-21",
      sourceBridgeId: "garmin",
      externalId: "ext-1",
    },
  ]);
  await older.table("profiles").bulkAdd([
    { id: "p-1", linkedAccounts: [{ source: "train2go" }] },
    { id: "p-2", linkedAccounts: [] },
    { id: "p-3", linkedAccounts: [{ source: "train2go" }] },
  ]);
  await older.table("integrationPolicies").add(EXISTING_POLICY);
  older.close();
};

const plannedImportPolicies = async (db: KaiordDatabase, profileId: string) =>
  db
    .table("integrationPolicies")
    .where("[profileId+dataType+direction+bridgeId]")
    .equals([profileId, "planned-session", "import", "train2go-bridge"])
    .toArray();

describe("Dexie provenance backfill + seeding (v28) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to head version 29", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should stamp unknown on a legacy health row and leave a sourced row intact", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const legacy = await db.table("healthSleep").get("h-legacy");
    const sourced = await db.table("healthSleep").get("h-sourced");
    db.close();

    // Assert
    expect(legacy?.sourceBridgeId).toBe("unknown");
    expect(sourced?.sourceBridgeId).toBe("garmin");
  });

  it("should seed an enabled planned-session import policy for a train2go-linked profile", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const policies = await plannedImportPolicies(db, "p-1");
    db.close();

    // Assert
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatchObject({ enabled: true, mode: "auto" });
  });

  it("should not seed a policy for a profile without a train2go link", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const policies = await plannedImportPolicies(db, "p-2");
    db.close();

    // Assert
    expect(policies).toEqual([]);
  });

  it("should not duplicate or overwrite an existing planned-session policy", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const policies = await plannedImportPolicies(db, "p-3");
    db.close();

    // Assert
    expect(policies).toHaveLength(1);
    expect(policies[0].enabled).toBe(false);
  });

  it("should be a no-op on a second open (idempotent)", async () => {
    // Arrange
    await seed(name);
    const first = new KaiordDatabase(name);
    await first.open();
    first.close();

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const p1 = await plannedImportPolicies(db, "p-1");
    const legacy = await db.table("healthSleep").get("h-legacy");
    db.close();

    // Assert
    expect(p1).toHaveLength(1);
    expect(legacy?.sourceBridgeId).toBe("unknown");
  });
});
