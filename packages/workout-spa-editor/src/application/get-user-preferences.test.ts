import { describe, expect, it } from "vitest";

import { createInMemoryUserPreferencesRepository } from "../test-utils/in-memory-user-preferences-repository";
import { getUserPreferences } from "./get-user-preferences";

const fixedClock = () => "2026-05-01T12:00:00.000Z";

describe("getUserPreferences", () => {
  it("returns the persisted row when one exists", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    await repo.put({
      profileId: "p1",
      calendarDensity: "comfortable",
      updatedAt: "2026-04-30T10:00:00.000Z",
    });

    const result = await getUserPreferences(
      { profileId: "p1" },
      { repository: repo, clock: fixedClock }
    );

    expect(result).toEqual({
      profileId: "p1",
      calendarDensity: "comfortable",
      updatedAt: "2026-04-30T10:00:00.000Z",
    });
  });

  it("returns the synthesised default when no row exists (no write)", async () => {
    const repo = createInMemoryUserPreferencesRepository();

    const result = await getUserPreferences(
      { profileId: "p1", defaultDensity: "compact" },
      { repository: repo, clock: fixedClock }
    );

    expect(result).toEqual({
      profileId: "p1",
      calendarDensity: "compact",
      updatedAt: "2026-05-01T12:00:00.000Z",
    });
    // Verify NO write happened.
    expect(await repo.get("p1")).toBeUndefined();
  });

  it("falls back to compact when no defaultDensity provided", async () => {
    const repo = createInMemoryUserPreferencesRepository();

    const result = await getUserPreferences(
      { profileId: "p1" },
      { repository: repo, clock: fixedClock }
    );

    expect(result.calendarDensity).toBe("compact");
  });

  it("uses comfortable default when caller passes it (mobile viewport)", async () => {
    const repo = createInMemoryUserPreferencesRepository();

    const result = await getUserPreferences(
      { profileId: "p1", defaultDensity: "comfortable" },
      { repository: repo, clock: fixedClock }
    );

    expect(result.calendarDensity).toBe("comfortable");
  });
});
