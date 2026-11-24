import { describe, expect, it } from "vitest";

import type { ProfileRepository } from "../../ports/persistence-port";
import { createInMemoryCapabilityDecisionRepository } from "../../test-utils/in-memory-capability-decision-repository";
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
  capabilityDecisions: createInMemoryCapabilityDecisionRepository(),
  profiles: profilesOf(rows),
});

const decisionsOf = async (deps: ReturnType<typeof depsFor>) =>
  Object.fromEntries(
    (await deps.capabilityDecisions.listByProfile("p1")).map((d) => [
      d.capabilityId,
      d.on,
    ])
  );

describe("setCapability", () => {
  it("should record the activation as the athlete's decision, stamped by the clock", async () => {
    // Arrange
    const deps = depsFor();

    // Act
    await setCapability({ profileId: "p1", id: "templates", on: true }, deps);

    // Assert
    expect(await deps.capabilityDecisions.listByProfile("p1")).toEqual([
      {
        profileId: "p1",
        capabilityId: "templates",
        on: true,
        updatedAt: "2026-11-23T10:00:00.000Z",
      },
    ]);
  });

  it("should keep the other decisions when one Capability changes", async () => {
    // Arrange
    const deps = depsFor();
    await setCapability({ profileId: "p1", id: "templates", on: true }, deps);
    await setCapability(
      { profileId: "p1", id: "authority-matrix", on: true },
      deps
    );

    // Act
    await setCapability({ profileId: "p1", id: "templates", on: false }, deps);

    // Assert
    expect(await decisionsOf(deps)).toEqual({
      templates: false,
      "authority-matrix": true,
    });
  });

  it("should leave the decisions alone when another preference is written", async () => {
    // Arrange
    const deps = depsFor();
    await setCapability({ profileId: "p1", id: "templates", on: true }, deps);

    // Act
    await setUserPreferenceFields(
      { profileId: "p1", patch: { calendarView: "list" } },
      {
        clock: deps.clock,
        repository: createInMemoryUserPreferencesRepository(),
        profileRepository: deps.profiles,
      }
    );

    // Assert
    expect(await decisionsOf(deps)).toEqual({ templates: true });
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
