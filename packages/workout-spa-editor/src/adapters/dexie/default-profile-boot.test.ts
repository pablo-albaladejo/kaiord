/**
 * Boot-time default profile: localized name, and the guarantee that writes
 * queued while the database opens (what the e2e seeders do right after
 * `page.goto`) run only after the creation settled, never interleaved.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { defaultProfileName } from "../../i18n/default-profile-name";
import type { Profile } from "../../types/profile";
import { createAppPersistence } from "../create-app-persistence";
import { registerDefaultProfileBoot } from "./default-profile-boot";
import { KaiordDatabase } from "./dexie-database";

const names: string[] = [];
const bootedDb = (language: string) => {
  const name = `kaiord-test-boot-profile-${Date.now()}-${Math.random()}`;
  names.push(name);
  const db = new KaiordDatabase(name);
  registerDefaultProfileBoot(db, createAppPersistence(db), () =>
    defaultProfileName(language)
  );
  return db;
};

afterEach(async () => {
  for (const name of names.splice(0)) await Dexie.delete(name);
});

describe("registerDefaultProfileBoot", () => {
  it.each([
    ["en-US", "My profile"],
    ["es-ES", "Mi perfil"],
  ])(
    "should create one active auto profile named for %s on first open",
    async (language, expected) => {
      // Arrange
      const db = bootedDb(language);

      // Act
      await db.open();

      // Assert
      const profiles = await db.table<Profile>("profiles").toArray();
      const active = await db.table("meta").get("activeProfileId");
      expect(profiles).toEqual([
        expect.objectContaining({ name: expected, origin: "auto" }),
      ]);
      expect(active?.value).toBe(profiles[0]?.id);
      db.close();
    }
  );

  it.each(["en-US", "es-ES"])(
    "should hold a clear-and-reseed queued during open until the creation settles (%s)",
    async (language) => {
      // Arrange
      const db = bootedDb(language);
      const seeded: Profile = {
        id: "seeded",
        name: "Seeded",
        linkedAccounts: [],
      };

      // Act
      await db.table("profiles").clear();
      await db.table("profiles").put(seeded);

      // Assert
      const profiles = await db.table<Profile>("profiles").toArray();
      expect(profiles.map((p) => p.id)).toEqual(["seeded"]);
      db.close();
    }
  );

  it("should not create a second profile when the database already has one", async () => {
    // Arrange
    const db = bootedDb("en-US");
    await db.open();
    db.close();

    // Act
    await db.open();

    // Assert
    expect(await db.table("profiles").count()).toBe(1);
    db.close();
  });
});
