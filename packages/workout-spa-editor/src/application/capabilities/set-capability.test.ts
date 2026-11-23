import { describe, expect, it } from "vitest";

import type { ProfileRepository } from "../../ports/persistence-port";
import { createInMemoryUserPreferencesRepository } from "../../test-utils/in-memory-user-preferences-repository";
import type { Profile } from "../../types/profile";
import { ProfileNotFoundError } from "../../types/session-match-errors";
import { setUserPreferenceFields } from "../set-user-preference-fields";
import { setCapability } from "./set-capability";

const PROFILE: Profile = {
  id: "p1",
  name: "Athlete",
  ftpW: 250,
  thresholdHr: 170,
  linkedAccounts: [],
};

const profilesOf = (rows: Profile[]): ProfileRepository => ({
  getAll: async () => rows,
  getById: async (id) => rows.find((row) => row.id === id),
  getActiveId: async () => null,
  setActiveId: async () => {},
  put: async () => {},
  delete: async () => {},
  count: async () => rows.length,
});

const depsFor = (rows: Profile[] = [PROFILE]) => ({
  clock: () => "2026-11-23T10:00:00.000Z",
  repository: createInMemoryUserPreferencesRepository(),
  profileRepository: profilesOf(rows),
});

describe("setCapability", () => {
  it("should record the activation on the athlete's preferences row", async () => {
    // Arrange
    const deps = depsFor();

    // Act
    await setCapability({ profileId: "p1", id: "templates", on: true }, deps);

    // Assert
    const row = await deps.repository.get("p1");
    expect(row?.capabilities).toEqual({ templates: true });
    expect(row?.updatedAt).toBe("2026-11-23T10:00:00.000Z");
  });

  it("should keep the other decisions when one Capability changes", async () => {
    // Arrange
    const deps = depsFor();
    await setCapability({ profileId: "p1", id: "templates", on: true }, deps);
    await setCapability({ profileId: "p1", id: "labs", on: true }, deps);

    // Act
    await setCapability({ profileId: "p1", id: "templates", on: false }, deps);

    // Assert
    const row = await deps.repository.get("p1");
    expect(row?.capabilities).toEqual({ templates: false, labs: true });
  });

  it("should keep the decisions when another preference is written", async () => {
    // Arrange
    const deps = depsFor();
    await setCapability({ profileId: "p1", id: "templates", on: true }, deps);

    // Act
    await setUserPreferenceFields(
      { profileId: "p1", patch: { calendarView: "list" } },
      deps
    );

    // Assert
    const row = await deps.repository.get("p1");
    expect(row?.capabilities).toEqual({ templates: true });
    expect(row?.calendarView).toBe("list");
  });

  it("should refuse a profile that no longer exists", async () => {
    // Arrange
    const deps = depsFor([]);

    // Act
    const write = setCapability(
      { profileId: "gone", id: "templates", on: true },
      deps
    );

    // Assert
    await expect(write).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});
