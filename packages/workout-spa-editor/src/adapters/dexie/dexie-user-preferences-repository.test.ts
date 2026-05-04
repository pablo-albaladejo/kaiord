import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import type { UserPreferences } from "../../types/user-preferences";
import { KaiordDatabase } from "./dexie-database";
import { createDexieUserPreferencesRepository } from "./dexie-user-preferences-repository";

const baseRow = (
  overrides: Partial<UserPreferences> = {}
): UserPreferences => ({
  profileId: "p1",
  calendarDensity: "compact",
  updatedAt: "2026-05-01T12:00:00.000Z",
  ...overrides,
});

describe("DexieUserPreferencesRepository", () => {
  let db: KaiordDatabase;

  beforeEach(() => {
    db = new KaiordDatabase(`kaiord-prefs-test-${Date.now()}-${Math.random()}`);
  });

  it("should return undefined from get when no row exists", async () => {
    const repo = createDexieUserPreferencesRepository(db);

    expect(await repo.get("p1")).toBeUndefined();
  });

  it("should round-trip via put-and-get", async () => {
    const repo = createDexieUserPreferencesRepository(db);
    const row = baseRow();

    await repo.put(row);

    expect(await repo.get("p1")).toEqual(row);
  });

  it("should upsert via put by profileId — second put replaces in place", async () => {
    const repo = createDexieUserPreferencesRepository(db);
    await repo.put(baseRow({ calendarDensity: "compact" }));

    await repo.put(baseRow({ calendarDensity: "comfortable" }));

    expect((await repo.get("p1"))?.calendarDensity).toBe("comfortable");
  });

  it("should be idempotent on delete when rows are missing", async () => {
    const repo = createDexieUserPreferencesRepository(db);

    await expect(repo.delete("never-existed")).resolves.toBeUndefined();
  });

  it("should remove the row on delete", async () => {
    const repo = createDexieUserPreferencesRepository(db);
    await repo.put(baseRow());

    await repo.delete("p1");

    expect(await repo.get("p1")).toBeUndefined();
  });

  it("should keep each profile in its own row", async () => {
    const repo = createDexieUserPreferencesRepository(db);

    await repo.put(baseRow({ profileId: "p1", calendarDensity: "compact" }));
    await repo.put(
      baseRow({ profileId: "p2", calendarDensity: "comfortable" })
    );

    expect((await repo.get("p1"))?.calendarDensity).toBe("compact");
    expect((await repo.get("p2"))?.calendarDensity).toBe("comfortable");
  });
});
