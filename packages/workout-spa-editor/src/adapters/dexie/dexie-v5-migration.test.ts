/**
 * Forward migration round-trip — schema v5 must preserve every pre-existing
 * row byte-identically and create the three new tables empty.
 *
 * The fixture is synthetic (representative shape per pre-existing table)
 * rather than a snapshot from production data, but its rows must remain
 * readable through the same queries the application uses.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import fixture from "../../test-fixtures/dexie-pre-redesign.json";
import { createDexieAutoMatchDismissalRepository } from "./dexie-auto-match-dismissal-repository";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSessionMatchRepository } from "./dexie-session-match-repository";
import { createDexieUserPreferencesRepository } from "./dexie-user-preferences-repository";

type Fixture = typeof fixture;

async function seedV4(name: string, data: Fixture): Promise<void> {
  const v4 = new Dexie(name);
  v4.version(1).stores({
    workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
    templates: "id, sport, *tags",
    profiles: "id",
    aiProviders: "id",
    syncState: "source",
    usage: "yearMonth",
    meta: "key",
  });
  v4.version(2).stores({
    workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
    templates: "id, sport, *tags",
    profiles: "id",
    aiProviders: "id",
    syncState: "source",
    usage: "yearMonth",
    meta: "key",
    bridges: "extensionId, status, lastSeen",
  });
  v4.version(4).stores({
    workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
    templates: "id, sport, *tags",
    profiles: "id",
    aiProviders: "id",
    syncState: "source",
    usage: "yearMonth",
    meta: "key",
    bridges: "extensionId, status, lastSeen",
    coachingActivities:
      "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
    coachingSyncState: "[source+profileId], source, profileId",
  });

  await v4.open();
  await v4.table("profiles").bulkPut(data.profiles);
  await v4.table("workouts").bulkPut(data.workouts);
  await v4.table("coachingActivities").bulkPut(data.coachingActivities);
  await v4.table("coachingSyncState").bulkPut(data.coachingSyncState);
  v4.close();
}

describe("Dexie v5 migration round-trip", () => {
  const dbName = `kaiord-migration-test-${Date.now()}-${Math.random()}`;

  it("should preserve every pre-existing row and creates new tables empty", async () => {
    // Arrange
    await seedV4(dbName, fixture);
    const db = new KaiordDatabase(dbName);
    await db.open();
    const profiles = await db.table("profiles").toArray();
    const workouts = await db.table("workouts").toArray();
    const activities = await db.table("coachingActivities").toArray();
    const sync = await db.table("coachingSyncState").toArray();
    expect(profiles).toEqual(fixture.profiles);
    expect(workouts).toEqual(fixture.workouts);
    expect(activities).toEqual(fixture.coachingActivities);
    expect(sync).toEqual(fixture.coachingSyncState);
    const sessionMatches = createDexieSessionMatchRepository(db);
    const userPrefs = createDexieUserPreferencesRepository(db);
    const dismissals = createDexieAutoMatchDismissalRepository(db);
    expect(
      await sessionMatches.listByProfileAndWeek(
        "p1",
        "2000-01-01",
        "2099-12-31"
      )
    ).toEqual([]);
    expect(await userPrefs.get("p1")).toBeUndefined();
    expect(
      await dismissals.getByProfileAndWeek("p1", "2026-04-27")
    ).toBeUndefined();

    // Act
    db.close();

    // Assert
  });
});
