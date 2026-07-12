/**
 * Forward migration to v29 — fail-open policy seeding. Opening KaiordDatabase
 * on a v28 database runs `applyV29Upgrade`: coaching-linked profiles get a
 * planned-session import route (idempotent over v28), and profiles with a live
 * garmin signal (a connected `connections` row OR a workout already pushed to
 * Garmin) get a workout export route. A profile with both keeps both.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v29-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_SEED = 28;
const SCHEMA_HEAD = 34;
const STORES_SEED = {
  profiles: "id",
  meta: "key",
  workouts: "id, profileId, [profileId+date], date",
  connections: "[profileId+providerId], profileId",
  integrationPolicies:
    "id, [profileId+dataType+direction], &[profileId+dataType+direction+bridgeId], profileId",
} as const;

const t2g = (id: string) => ({ id, linkedAccounts: [{ source: "train2go" }] });
const plain = (id: string) => ({ id, linkedAccounts: [] });
const conn = (profileId: string, status: string) => ({
  profileId,
  providerId: "garmin",
  status,
  mechanism: "bridge",
  updatedAt: "2026-05-01T10:00:00.000Z",
});

const seed = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SCHEMA_SEED).stores(STORES_SEED);
  await older.open();
  await older
    .table("profiles")
    .bulkAdd([
      t2g("p-t2g"),
      plain("p-none"),
      t2g("p-both"),
      plain("p-conn"),
      plain("p-push"),
      plain("p-disc"),
    ]);
  await older
    .table("connections")
    .bulkAdd([
      conn("p-conn", "connected"),
      conn("p-both", "connected"),
      conn("p-disc", "disconnected"),
    ]);
  await older.table("workouts").bulkAdd([
    {
      id: "w-push",
      profileId: "p-push",
      date: "2026-04-13",
      garminPushId: "g-1",
    },
    {
      id: "w-none",
      profileId: "p-none",
      date: "2026-04-13",
      garminPushId: null,
    },
  ]);
  await older.table("integrationPolicies").add({
    id: "00000000-0000-4000-8000-000000000001",
    profileId: "p-t2g",
    dataType: "planned-session",
    bridgeId: "train2go-bridge",
    direction: "import",
    mode: "auto",
    enabled: true,
    updatedAt: "2026-05-01T10:00:00.000Z",
  });
  older.close();
};

const route = async (
  db: KaiordDatabase,
  profileId: string,
  dataType: string,
  direction: string,
  bridgeId: string
) =>
  db
    .table("integrationPolicies")
    .where("[profileId+dataType+direction+bridgeId]")
    .equals([profileId, dataType, direction, bridgeId])
    .toArray();

const plannedImport = (db: KaiordDatabase, p: string) =>
  route(db, p, "planned-session", "import", "train2go-bridge");
const workoutExport = (db: KaiordDatabase, p: string) =>
  route(db, p, "workout", "export", "garmin-bridge");

describe("Dexie fail-open seeding (v29) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
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

  it("should not duplicate the v28-seeded train2go planned-session route", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const routes = await plannedImport(db, "p-t2g");
    db.close();

    // Assert
    expect(routes).toHaveLength(1);
  });

  it.each([
    { profileId: "p-conn", signal: "a connected connections row" },
    { profileId: "p-push", signal: "push history (garminPushId)" },
  ])(
    "should seed a garmin export route from $signal",
    async ({ profileId }) => {
      // Arrange
      await seed(name);

      // Act
      const db = new KaiordDatabase(name);
      await db.open();
      const routes = await workoutExport(db, profileId);
      db.close();

      // Assert
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({ enabled: true });
    }
  );

  it("should give a train2go+garmin profile BOTH routes enabled (day-1 continuity)", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const planned = await plannedImport(db, "p-both");
    const exported = await workoutExport(db, "p-both");
    db.close();

    // Assert
    expect(planned).toHaveLength(1);
    expect(exported).toHaveLength(1);
  });

  it("should seed nothing for an unconnected profile or a disconnected garmin", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const none = await db
      .table("integrationPolicies")
      .where("profileId")
      .equals("p-none")
      .toArray();
    const disc = await workoutExport(db, "p-disc");
    db.close();

    // Assert
    expect(none).toEqual([]);
    expect(disc).toEqual([]);
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
    const planned = await plannedImport(db, "p-both");
    const exported = await workoutExport(db, "p-both");
    db.close();

    // Assert
    expect(planned).toHaveLength(1);
    expect(exported).toHaveLength(1);
  });
});
