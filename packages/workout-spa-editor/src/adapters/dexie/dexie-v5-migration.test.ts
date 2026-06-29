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

const SCHEMA_V4 = 4;

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
  v4.version(SCHEMA_V4).stores({
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
  // v13 expects meta.activeProfileId to be set when workouts exist.
  // Seed it so the workout-profileId backfill resolves cleanly.
  await v4.table("meta").put({ key: "activeProfileId", value: "p1" });
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
    const sessionMatches = createDexieSessionMatchRepository(db);
    const userPrefs = createDexieUserPreferencesRepository(db);
    const dismissals = createDexieAutoMatchDismissalRepository(db);
    // userPreferences and autoMatchDismissals are still untouched by
    // any forward migration. sessionMatches MAY contain v10 retro-fix
    // rows (per coaching-activity-dialog-redesign / D8) when a
    // converted-without-match pair exists in the fixture; this fixture
    // has exactly one such pair, so we assert the row's shape rather
    // than emptiness.
    const matches = await sessionMatches.listByProfileAndWeek(
      "p1",
      "2000-01-01",
      "2099-12-31"
    );
    const storedUserPrefs = await userPrefs.get("p1");
    const storedDismissal = await dismissals.getByProfileAndWeek(
      "p1",
      "2026-04-27"
    );

    // Act
    db.close();

    // Assert
    expect(profiles).toEqual(fixture.profiles);
    // v13 backfills profileId on every legacy workout row; the rest of
    // the fixture is preserved byte-identically. We assert the per-row
    // shape rather than reusing the v4 fixture directly.
    expect(workouts).toEqual(
      fixture.workouts.map((w) => ({ ...w, profileId: "p1" }))
    );
    expect(activities).toEqual(fixture.coachingActivities);
    expect(sync).toEqual(fixture.coachingSyncState);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      profileId: "p1",
      coachingActivityId: "p1:train2go:12345",
      workoutId: "w-pre-1",
      source: "auto-coaching-v10-migration",
    });
    expect(storedUserPrefs).toBeUndefined();
    expect(storedDismissal).toBeUndefined();
  });
});
