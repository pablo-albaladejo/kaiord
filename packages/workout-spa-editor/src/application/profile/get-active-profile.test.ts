import { describe, expect, it } from "vitest";

import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import type { Profile } from "../../types/profile";
import { getActiveProfile } from "./get-active-profile";

const makeProfile = (id: string): Profile => ({
  id,
  name: `Profile ${id}`,
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

describe("getActiveProfile", () => {
  it("should return null when no active profile id is set", async () => {
    // Arrange

    // Act
    const profiles = createInMemoryProfileRepository();

    // Assert
    expect(await getActiveProfile(profiles)).toBeNull();
  });

  it("should return null when active id points to a deleted profile", async () => {
    // Arrange
    const profiles = createInMemoryProfileRepository();

    // Act
    await profiles.setActiveId("missing");

    // Assert
    expect(await getActiveProfile(profiles)).toBeNull();
  });

  it("should return the profile referenced by the active id", async () => {
    // Arrange
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("p1"));
    await profiles.setActiveId("p1");

    // Act
    const result = await getActiveProfile(profiles);

    // Assert
    expect(result?.id).toBe("p1");
  });
});
