import { describe, expect, it } from "vitest";

import type { UserPreferences } from "../types/user-preferences";
import { createInMemoryUserPreferencesRepository } from "./in-memory-user-preferences-repository";

const baseRow = (
  overrides: Partial<UserPreferences> = {}
): UserPreferences => ({
  profileId: "p1",
  calendarView: "grid",
  updatedAt: "2026-05-01T12:00:00.000Z",
  ...overrides,
});

describe("InMemoryUserPreferencesRepository", () => {
  it("get returns undefined when no row exists", async () => {
    const repo = createInMemoryUserPreferencesRepository();

    expect(await repo.get("p1")).toBeUndefined();
  });

  it("put-and-get round trip", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    const row = baseRow();

    await repo.put(row);

    expect(await repo.get("p1")).toEqual(row);
  });

  it("put is upsert by profileId", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    await repo.put(baseRow({ calendarView: "grid" }));

    await repo.put(baseRow({ calendarView: "list" }));

    expect((await repo.get("p1"))?.calendarView).toBe("list");
  });

  it("delete is idempotent on missing rows", async () => {
    const repo = createInMemoryUserPreferencesRepository();

    await expect(repo.delete("never-existed")).resolves.toBeUndefined();
  });

  it("delete removes the row", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    await repo.put(baseRow());

    await repo.delete("p1");

    expect(await repo.get("p1")).toBeUndefined();
  });

  it("each profile has its own row", async () => {
    const repo = createInMemoryUserPreferencesRepository();

    await repo.put(baseRow({ profileId: "p1", calendarView: "grid" }));
    await repo.put(baseRow({ profileId: "p2", calendarView: "list" }));

    expect((await repo.get("p1"))?.calendarView).toBe("grid");
    expect((await repo.get("p2"))?.calendarView).toBe("list");
  });
});
