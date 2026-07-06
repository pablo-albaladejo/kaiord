/**
 * Forward migration to v27 — Data Hub domain tables. Seeding a v26 database
 * with `coachingActivities` + `integrationPolicies` and opening
 * `KaiordDatabase` runs `applyV27Upgrade`: every coaching activity is copied
 * into `plannedSessions` with its id preserved, the source table is retained,
 * and every `integrationPolicies.dataType: "training-plan"` row (orphans
 * included) is rewritten to "planned-session".
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v27-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_SEED = 26;
const SCHEMA_HEAD = 27;
const STORES_SEED = {
  profiles: "id",
  meta: "key",
  coachingActivities:
    "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
  integrationPolicies:
    "id, [profileId+dataType+direction], &[profileId+dataType+direction+bridgeId], profileId",
} as const;

type Row = Record<string, unknown>;

const coaching = (profileId: string, sourceId: string, date: string): Row => ({
  id: `${profileId}:train2go:${sourceId}`,
  profileId,
  source: "train2go",
  sourceId,
  date,
  sport: "cycling",
  title: `Session ${sourceId}`,
  status: "pending",
  fetchedAt: "2026-05-01T10:00:00.000Z",
});

const policy = (
  id: string,
  profileId: string,
  dataType: string,
  bridgeId: string
): Row => ({
  id,
  profileId,
  dataType,
  direction: "import",
  bridgeId,
  mode: "auto",
  enabled: true,
  updatedAt: "2026-05-01T10:00:00.000Z",
});

const COACHING = [
  coaching("p-1", "1", "2026-04-29"),
  coaching("p-1", "2", "2026-04-30"),
  coaching("p-2", "9", "2026-05-01"),
];

const POLICIES = [
  policy("pol-1", "p-1", "training-plan", "train2go-bridge"),
  // Orphan: profile has no coaching rows but a stale training-plan policy.
  policy("pol-2", "p-9", "training-plan", "train2go-bridge"),
  policy("pol-3", "p-1", "workout", "garmin-bridge"),
];

const seed = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SCHEMA_SEED).stores(STORES_SEED);
  await older.open();
  await older.table("coachingActivities").bulkAdd([...COACHING]);
  await older.table("integrationPolicies").bulkAdd([...POLICIES]);
  older.close();
};

describe("Dexie Data Hub (v27) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to head version 27", async () => {
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

  it("should copy coaching activities into plannedSessions preserving ids", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const planned = await db.table("plannedSessions").toArray();
    db.close();

    // Assert
    expect(planned).toHaveLength(COACHING.length);
    expect(planned.map((r) => r.id).sort()).toEqual(
      COACHING.map((r) => r.id).sort()
    );
  });

  it("should retain the coachingActivities source table for reversibility", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const count = await db.table("coachingActivities").count();
    db.close();

    // Assert
    expect(count).toBe(COACHING.length);
  });

  it("should leave zero training-plan rows in integrationPolicies", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const policies = await db.table("integrationPolicies").toArray();
    db.close();

    // Assert
    const trainingPlan = policies.filter((p) => p.dataType === "training-plan");
    expect(trainingPlan).toEqual([]);
  });

  it("should rewrite training-plan policies (orphans included) to planned-session", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const rewritten = await db.table("integrationPolicies").get("pol-2");
    const untouched = await db.table("integrationPolicies").get("pol-3");
    db.close();

    // Assert
    expect(rewritten?.dataType).toBe("planned-session");
    expect(untouched?.dataType).toBe("workout");
  });
});
