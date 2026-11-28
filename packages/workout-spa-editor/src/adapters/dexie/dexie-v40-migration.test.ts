/**
 * Forward migration to v40 — Capability decisions move off the preferences
 * row into a store of their own. Seeding a real v39 database with a
 * preferences row that carries the `capabilities` map, then opening
 * KaiordDatabase, writes one decision row per entry stamped with the row's
 * `updatedAt`, and leaves the preferences row without the map.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { capabilityDecisionSchema } from "../../types/capability-decision";
import { SCHEMAS } from "./dexie-schemas";
import { V37_STORES } from "./dexie-v37-migration";
import { V38_STORES } from "./register-kaiord-v38";

const SEED_VERSION = 39;
const SCHEMA_HEAD = 41;
const AT = "2026-11-23T10:00:00.000Z";

const PREFS = { calendarView: "list", setupChecklistDismissed: true };

const seedV39 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older
    .version(SEED_VERSION)
    .stores({ ...SCHEMAS.v35, ...V37_STORES, ...V38_STORES });
  await older.open();
  await older.table("userPreferences").bulkAdd([
    {
      profileId: "p-1",
      ...PREFS,
      capabilities: { templates: false, "authority-matrix": true },
      updatedAt: AT,
    },
    { profileId: "p-2", ...PREFS, updatedAt: AT },
  ]);
  older.close();
};

describe("Dexie Capability decisions store (v40) migration", () => {
  const db = sharedKaiordDatabase("v40");

  it("should move every decision off the preferences row into its own row", async () => {
    // Arrange
    await seedV39(db.name);

    // Act
    await db.open();
    const version = db.verno;
    const decisions = await db
      .table("capabilityDecisions")
      .orderBy("[profileId+capabilityId]")
      .toArray();
    const prefs = await db
      .table("userPreferences")
      .orderBy("profileId")
      .toArray();
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
    expect(decisions).toStrictEqual([
      {
        profileId: "p-1",
        capabilityId: "authority-matrix",
        on: true,
        updatedAt: AT,
      },
      { profileId: "p-1", capabilityId: "templates", on: false, updatedAt: AT },
    ]);
    expect(
      decisions.every((d) => capabilityDecisionSchema.safeParse(d).success)
    ).toBe(true);
    expect(prefs).toStrictEqual([
      { profileId: "p-1", ...PREFS, updatedAt: AT },
      { profileId: "p-2", ...PREFS, updatedAt: AT },
    ]);
  });
});
