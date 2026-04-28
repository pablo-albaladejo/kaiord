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
  it("returns null when no active profile id is set", async () => {
    const profiles = createInMemoryProfileRepository();
    expect(await getActiveProfile(profiles)).toBeNull();
  });

  it("returns null when active id points to a deleted profile", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.setActiveId("missing");

    expect(await getActiveProfile(profiles)).toBeNull();
  });

  it("returns the profile referenced by the active id", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("p1"));
    await profiles.setActiveId("p1");

    const result = await getActiveProfile(profiles);

    expect(result?.id).toBe("p1");
  });
});
