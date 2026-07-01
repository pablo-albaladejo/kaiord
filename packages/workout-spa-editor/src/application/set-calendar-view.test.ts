import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { createInMemoryUserPreferencesRepository } from "../test-utils/in-memory-user-preferences-repository";
import type { Profile } from "../types/profile";
import { ProfileNotFoundError } from "../types/session-match-errors";
import { setCalendarView } from "./set-calendar-view";

const stubProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "p1",
  name: "Athlete",
  ftpW: 250,
  thresholdHr: 170,
  linkedAccounts: [],
  ...overrides,
});

const fixedClock = () => "2026-05-01T12:00:00.000Z";

describe("setCalendarView", () => {
  it("should create the row on first call with updatedAt from injected clock", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = createInMemoryPersistence().profiles;
    await profileRepo.put(stubProfile());

    // Act
    await setCalendarView(
      { profileId: "p1", view: "list" },
      { clock: fixedClock, repository: repo, profileRepository: profileRepo }
    );

    // Assert
    expect(await repo.get("p1")).toEqual({
      profileId: "p1",
      calendarView: "list",
      updatedAt: "2026-05-01T12:00:00.000Z",
    });
  });

  it("should update the row in place on subsequent calls", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = createInMemoryPersistence().profiles;
    await profileRepo.put(stubProfile());
    await setCalendarView(
      { profileId: "p1", view: "list" },
      {
        clock: () => "2026-05-01T10:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    // Act
    await setCalendarView(
      { profileId: "p1", view: "grid" },
      {
        clock: () => "2026-05-01T15:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    // Assert
    expect(await repo.get("p1")).toEqual({
      profileId: "p1",
      calendarView: "grid",
      updatedAt: "2026-05-01T15:00:00.000Z",
    });
  });

  it("should still refresh updatedAt when idempotent on same value", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = createInMemoryPersistence().profiles;
    await profileRepo.put(stubProfile());
    await setCalendarView(
      { profileId: "p1", view: "grid" },
      {
        clock: () => "2026-05-01T10:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    // Act
    await setCalendarView(
      { profileId: "p1", view: "grid" },
      {
        clock: () => "2026-05-01T15:00:00.000Z",
        repository: repo,
        profileRepository: profileRepo,
      }
    );

    // Assert
    expect((await repo.get("p1"))?.updatedAt).toBe("2026-05-01T15:00:00.000Z");
  });

  it("should throw ProfileNotFoundError when profile is missing (concurrent delete)", async () => {
    // Arrange
    const repo = createInMemoryUserPreferencesRepository();
    const profileRepo = createInMemoryPersistence().profiles;

    // Act
    // (profileRepo has no entries — simulates a concurrent delete)

    // Assert
    await expect(
      setCalendarView(
        { profileId: "p1", view: "grid" },
        { clock: fixedClock, repository: repo, profileRepository: profileRepo }
      )
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
    expect(await repo.get("p1")).toBeUndefined();
  });
});
