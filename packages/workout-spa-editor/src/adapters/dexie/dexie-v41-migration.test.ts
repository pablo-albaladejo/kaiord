/**
 * Forward migration to v41 — the Athlete notes store. Seeding a real v40
 * database, then opening KaiordDatabase, adds an empty `athleteNotes` store
 * keyed by the Coaching Activity's id and indexed by profile, and keeps the
 * rows of every other store.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { athleteNoteSchema } from "../../types/athlete-note";
import { SCHEMAS } from "./dexie-schemas";
import { V37_STORES } from "./dexie-v37-migration";
import { V40_STORES } from "./dexie-v40-migration";
import { V38_STORES } from "./register-kaiord-v38";

const SEED_VERSION = 40;
const SCHEMA_HEAD = 41;
const AT = "2026-11-25T10:00:00.000Z";
const ACTIVITY_ID = "p-1:train2go:42";

const seedV40 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older
    .version(SEED_VERSION)
    .stores({ ...SCHEMAS.v35, ...V37_STORES, ...V38_STORES, ...V40_STORES });
  await older.open();
  await older.table("capabilityDecisions").add({
    profileId: "p-1",
    capabilityId: "templates",
    on: true,
    updatedAt: AT,
  });
  older.close();
};

describe("Dexie Athlete notes store (v41) migration", () => {
  const db = sharedKaiordDatabase("v41");

  it("should add an empty Athlete notes store and keep the other stores", async () => {
    // Arrange
    await seedV40(db.name);

    // Act
    await db.open();
    const version = db.verno;
    const notesBefore = await db.table("athleteNotes").count();
    const decisions = await db.table("capabilityDecisions").count();
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
    expect(notesBefore).toBe(0);
    expect(decisions).toBe(1);
  });

  it("should store a note by its Coaching Activity and find it by profile", async () => {
    // Arrange
    await seedV40(db.name);
    const note = {
      id: ACTIVITY_ID,
      profileId: "p-1",
      text: "on the trainer",
      updatedAt: AT,
    };

    // Act
    await db.open();
    await db.table("athleteNotes").put(note);
    const byId = await db.table("athleteNotes").get(ACTIVITY_ID);
    const byProfile = await db
      .table("athleteNotes")
      .where("profileId")
      .equals("p-1")
      .toArray();
    db.close();

    // Assert
    expect(byId).toStrictEqual(note);
    expect(byProfile).toStrictEqual([note]);
    expect(athleteNoteSchema.safeParse(byId).success).toBe(true);
  });
});
