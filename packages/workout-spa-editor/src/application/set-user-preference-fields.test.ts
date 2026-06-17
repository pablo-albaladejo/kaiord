import { describe, expect, it } from "vitest";

import type { ProfileRepository } from "../ports/persistence-port";
import { createInMemoryUserPreferencesRepository } from "../test-utils/in-memory-user-preferences-repository";
import type { Profile } from "../types/profile";
import { ProfileNotFoundError } from "../types/session-match-errors";
import { setUserPreferenceFields } from "./set-user-preference-fields";

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
    getActiveId: async () => null,
    setActiveId: async () => {},
    put: async (p) => {
      map.set(p.id, p);
    },
    delete: async (id) => {
      map.delete(id);
    },
    count: async () => map.size,
  };
};

const fixedClock = () => "2026-05-22T12:00:00.000Z";

describe("setUserPreferenceFields", () => {
  it("should create the row with lastScratchSport on first call", async () => {
    // Arrange
    const repository = createInMemoryUserPreferencesRepository();
    const profileRepository = stubProfileRepo([stubProfile()]);

    // Act
    await setUserPreferenceFields(
      { profileId: "p1", patch: { lastScratchSport: "running" } },
      { clock: fixedClock, repository, profileRepository }
    );

    // Assert
    expect(await repository.get("p1")).toEqual({
      profileId: "p1",
      calendarView: "grid",
      lastScratchSport: "running",
      aiBannerExpanded: undefined,
      updatedAt: "2026-05-22T12:00:00.000Z",
    });
  });

  it("should merge aiBannerExpanded onto an existing row preserving other fields", async () => {
    // Arrange
    const repository = createInMemoryUserPreferencesRepository();
    const profileRepository = stubProfileRepo([stubProfile()]);
    await setUserPreferenceFields(
      { profileId: "p1", patch: { lastScratchSport: "swimming" } },
      {
        clock: () => "2026-05-22T10:00:00.000Z",
        repository,
        profileRepository,
      }
    );

    // Act
    await setUserPreferenceFields(
      { profileId: "p1", patch: { aiBannerExpanded: true } },
      {
        clock: () => "2026-05-22T15:00:00.000Z",
        repository,
        profileRepository,
      }
    );

    // Assert
    expect(await repository.get("p1")).toEqual({
      profileId: "p1",
      calendarView: "grid",
      lastScratchSport: "swimming",
      aiBannerExpanded: true,
      updatedAt: "2026-05-22T15:00:00.000Z",
    });
  });

  it("should persist activeSport on first call", async () => {
    // Arrange
    const repository = createInMemoryUserPreferencesRepository();
    const profileRepository = stubProfileRepo([stubProfile()]);

    // Act
    await setUserPreferenceFields(
      { profileId: "p1", patch: { activeSport: "running" } },
      { clock: fixedClock, repository, profileRepository }
    );

    // Assert
    expect((await repository.get("p1"))?.activeSport).toBe("running");
  });

  it("should preserve activeSport when a later patch changes another field", async () => {
    // Arrange
    const repository = createInMemoryUserPreferencesRepository();
    const profileRepository = stubProfileRepo([stubProfile()]);
    await setUserPreferenceFields(
      { profileId: "p1", patch: { activeSport: "swimming" } },
      { clock: fixedClock, repository, profileRepository }
    );

    // Act
    await setUserPreferenceFields(
      { profileId: "p1", patch: { calendarView: "list" } },
      { clock: fixedClock, repository, profileRepository }
    );

    // Assert
    const row = await repository.get("p1");
    expect(row?.activeSport).toBe("swimming");
    expect(row?.calendarView).toBe("list");
  });

  it("should throw ProfileNotFoundError when profile is missing", async () => {
    // Arrange
    const repository = createInMemoryUserPreferencesRepository();
    const profileRepository = stubProfileRepo([]);

    // Act

    // Assert
    await expect(
      setUserPreferenceFields(
        { profileId: "p1", patch: { lastScratchSport: "running" } },
        { clock: fixedClock, repository, profileRepository }
      )
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
    expect(await repository.get("p1")).toBeUndefined();
  });
});
