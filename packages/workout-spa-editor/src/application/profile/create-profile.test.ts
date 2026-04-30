import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { createProfile } from "./create-profile";

describe("createProfile", () => {
  it("persists a profile and selects it as active when none existed", async () => {
    const persistence = createInMemoryPersistence();

    const profile = await createProfile(persistence, "Pablo");

    expect(profile.name).toBe("Pablo");
    expect(profile.id).toBeDefined();
    expect(await persistence.profiles.getAll()).toHaveLength(1);
    expect(await persistence.profiles.getActiveId()).toBe(profile.id);
  });

  it("preserves the existing active id when a profile already exists", async () => {
    const persistence = createInMemoryPersistence();
    const first = await createProfile(persistence, "First");

    const second = await createProfile(persistence, "Second");

    expect(await persistence.profiles.getAll()).toHaveLength(2);
    expect(await persistence.profiles.getActiveId()).toBe(first.id);
    expect(second.id).not.toBe(first.id);
  });

  it("rolls back the put when setActiveId rejects on the first profile (transaction atomicity)", async () => {
    const persistence = createInMemoryPersistence();
    persistence.profiles.setActiveId = () =>
      Promise.reject(new Error("simulated"));

    await expect(createProfile(persistence, "Pablo")).rejects.toThrow(
      "simulated"
    );

    expect(await persistence.profiles.getAll()).toEqual([]);
    expect(await persistence.profiles.getActiveId()).toBeNull();
  });
});
