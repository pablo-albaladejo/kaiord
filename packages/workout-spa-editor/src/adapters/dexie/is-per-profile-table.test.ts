/**
 * Tests for `isPerProfileTable` — the single source of truth used by both
 * the cascade fan-out test and the production cascade enumeration in
 * `deleteProfile`.
 *
 * Adding a new per-profile table without updating `deleteProfile` MUST
 * cause the cascade fan-out test in
 * `delete-profile.cascade.integration.test.ts` to fail. The contract is
 * intentional — see design D18.
 */

import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isPerProfileTable } from "./is-per-profile-table";

const dbName = (suffix: string) =>
  `kaiord-test-isperprofile-${suffix}-${Date.now()}`;

describe("isPerProfileTable", () => {
  let name: string;
  let db: Dexie;

  beforeEach(() => {
    name = dbName("scenario");
  });

  afterEach(async () => {
    if (db) db.close();
    await Dexie.delete(name);
  });

  const open = async (stores: Record<string, string>): Promise<Dexie> => {
    db = new Dexie(name);
    db.version(1).stores(stores);
    await db.open();
    return db;
  };

  it("returns true when the primary key is `profileId` alone", async () => {
    // Arrange

    // Act
    const d = await open({ userPreferences: "profileId" });

    // Assert
    expect(isPerProfileTable(d.table("userPreferences"))).toBe(true);
  });

  it("returns true when the primary key is compound starting with `profileId`", async () => {
    // Arrange

    // Act
    const d = await open({
      sessions: "[profileId+coachingActivityId]",
      dismissals: "[profileId+weekStart]",
    });

    // Assert
    expect(isPerProfileTable(d.table("sessions"))).toBe(true);
    expect(isPerProfileTable(d.table("dismissals"))).toBe(true);
  });

  it("returns true when the primary key is generic but a top-level `profileId` index exists", async () => {
    // Arrange

    // Act
    const d = await open({
      coachingActivities: "id, profileId, [profileId+date]",
    });

    // Assert
    expect(isPerProfileTable(d.table("coachingActivities"))).toBe(true);
  });

  it("returns true when the table has only compound indexes that start with `profileId`", async () => {
    // Arrange

    // Act
    const d = await open({
      coachingActivities:
        "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
    });

    // Assert
    expect(isPerProfileTable(d.table("coachingActivities"))).toBe(true);
  });

  it("returns false when the table has no `profileId` PK or index", async () => {
    // Arrange

    // Act
    const d = await open({
      workouts: "id, date, sport",
      bridges: "extensionId, status, lastSeen",
    });

    // Assert
    expect(isPerProfileTable(d.table("workouts"))).toBe(false);
    expect(isPerProfileTable(d.table("bridges"))).toBe(false);
  });

  it("returns false when `profileId` only appears inside a compound index that does not start with it", async () => {
    // Arrange

    // Act
    const d = await open({
      activities: "id, [date+profileId]",
    });

    // Assert
    expect(isPerProfileTable(d.table("activities"))).toBe(false);
  });
});
