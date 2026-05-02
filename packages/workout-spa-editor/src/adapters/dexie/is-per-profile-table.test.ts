/**
 * Tests for `isPerProfileTable` — the single source of truth used by both
 * the cascade fan-out test and the production cascade enumeration in
 * `deleteProfile`.
 *
 * Adding a new per-profile table without updating `deleteProfile` MUST
 * cause the cascade fan-out test in `delete-profile.test.ts` to fail.
 * The contract is intentional — see design D18.
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
    const d = await open({ userPreferences: "profileId" });

    expect(isPerProfileTable(d.table("userPreferences"))).toBe(true);
  });

  it("returns true when the primary key is compound starting with `profileId`", async () => {
    const d = await open({
      sessions: "[profileId+coachingActivityId]",
      dismissals: "[profileId+weekStart]",
    });

    expect(isPerProfileTable(d.table("sessions"))).toBe(true);
    expect(isPerProfileTable(d.table("dismissals"))).toBe(true);
  });

  it("returns true when the primary key is generic but a top-level `profileId` index exists", async () => {
    const d = await open({
      coachingActivities: "id, profileId, [profileId+date]",
    });

    expect(isPerProfileTable(d.table("coachingActivities"))).toBe(true);
  });

  it("returns true when the table has only compound indexes that start with `profileId`", async () => {
    // Mirrors the production `coachingActivities` schema: PK is `id`, no
    // top-level profileId index, but every secondary index is compound and
    // starts with profileId. Dexie treats these as profile-scoped entry
    // points; the cascade test relies on this case to discover the table.
    const d = await open({
      coachingActivities:
        "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
    });

    expect(isPerProfileTable(d.table("coachingActivities"))).toBe(true);
  });

  it("returns false when the table has no `profileId` PK or index", async () => {
    const d = await open({
      workouts: "id, date, sport",
      bridges: "extensionId, status, lastSeen",
    });

    expect(isPerProfileTable(d.table("workouts"))).toBe(false);
    expect(isPerProfileTable(d.table("bridges"))).toBe(false);
  });

  it("returns false when `profileId` only appears inside a compound index that does not start with it", async () => {
    // A `[date+profileId]` compound index does NOT mark the table per-profile —
    // the predicate only honors `profileId` as a primary entry-point identifier.
    const d = await open({
      activities: "id, [date+profileId]",
    });

    expect(isPerProfileTable(d.table("activities"))).toBe(false);
  });
});
