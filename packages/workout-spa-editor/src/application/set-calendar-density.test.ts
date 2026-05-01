import { describe, expect, it } from "vitest";

import { createInMemoryUserPreferencesRepository } from "../test-utils/in-memory-user-preferences-repository";
import { ProfileNotFoundError } from "../types/session-match-errors";
import type { ProfileRepository } from "../ports/persistence-port";
import type { Profile } from "../types/profile";
import { setCalendarDensity } from "./set-calendar-density";

const stubProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "p1",
  name: "Athlete",
  ftpW: 250,
  thresholdHr: 170,
  linkedAccounts: [],
  ...overrides,
});

const stubProfileRepo = (rows: Profile[]): ProfileRepository => {
  const map = new Map(rows.map((r) => [r.id, r]));
  return {
    getAll: async () => [...map.values()],
    getById: async (id) => map.get(id),
    put: async (p) => {
      map.set(p.id, p);
    },
    delete: async (id) => {
      map.delete(id);
    },
  };
};

const fixedClock = () => "2026-05-01T12:00:00.000Z";

describe("setCalendarDensity", () => {
  it("creates the row on first call with updatedAt from injected clock", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = stubProfileRepo([stubProfile()]);

    await setCalendarDensity(
      { profileId: "p1", density: "comfortable" },
      { clock: fixedClock, repository: repo, profileRepository: profileRepo }
    );

    expect(await repo.get("p1")).toEqual({
      profileId: "p1",
      calendarDensity: "comfortable",
      updatedAt: "2026-05-01T12:00:00.000Z",
    });
  });

  it("updates the row in place on subsequent calls", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = stubProfileRepo([stubProfile()]);
    await setCalendarDensity(
      { profileId: "p1", density: "comfortable" },
      {
        clock: () => "2026-05-01T10:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    await setCalendarDensity(
      { profileId: "p1", density: "compact" },
      {
        clock: () => "2026-05-01T15:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    expect(await repo.get("p1")).toEqual({
      profileId: "p1",
      calendarDensity: "compact",
      updatedAt: "2026-05-01T15:00:00.000Z",
    });
  });

  it("idempotent on same value still refreshes updatedAt", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = stubProfileRepo([stubProfile()]);
    await setCalendarDensity(
      { profileId: "p1", density: "compact" },
      {
        clock: () => "2026-05-01T10:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    await setCalendarDensity(
      { profileId: "p1", density: "compact" },
      {
        clock: () => "2026-05-01T15:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    expect((await repo.get("p1"))?.updatedAt).toBe("2026-05-01T15:00:00.000Z");
  });

  it("throws ProfileNotFoundError when profile is missing (concurrent delete)", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = stubProfileRepo([]); // no profiles

    await expect(
      setCalendarDensity(
        { profileId: "p1", density: "compact" },
        { clock: fixedClock, repository: repo, profileRepository: profileRepo }
      )
    ).rejects.toBeInstanceOf(ProfileNotFoundError);

    // No orphan row written.
    expect(await repo.get("p1")).toBeUndefined();
  });

  it("uses injected clock — no real-time leakage", async () => {
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = stubProfileRepo([stubProfile()]);

    await setCalendarDensity(
      { profileId: "p1", density: "compact" },
      {
        clock: () => "2026-04-01T00:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    expect((await repo.get("p1"))?.updatedAt).toBe("2026-04-01T00:00:00.000Z");
  });
});
