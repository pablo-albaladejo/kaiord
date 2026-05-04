import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { deleteProfile } from "./delete-profile";
import { makeProfile, seedProfile } from "./test-fixtures";

describe("deleteProfile", () => {
  it("should remove the profile and clears the active id when it matched", async () => {
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    await seedProfile(persistence, profile);
    await persistence.profiles.setActiveId(profile.id);

    await deleteProfile(persistence, profile.id);

    expect(await persistence.profiles.getById(profile.id)).toBeUndefined();
    expect(await persistence.profiles.getActiveId()).toBeNull();
  });

  it("should preserve a non-matching active id", async () => {
    const persistence = createInMemoryPersistence();
    const a = makeProfile({ id: "00000000-0000-4000-8000-0000000000e1" });
    const b = makeProfile({ id: "00000000-0000-4000-8000-0000000000e2" });
    await seedProfile(persistence, a);
    await seedProfile(persistence, b);
    await persistence.profiles.setActiveId(a.id);

    await deleteProfile(persistence, b.id);

    expect(await persistence.profiles.getActiveId()).toBe(a.id);
    expect(await persistence.profiles.getById(b.id)).toBeUndefined();
  });

  it("should roll back the delete when setActiveId rejects (transaction atomicity)", async () => {
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    await seedProfile(persistence, profile);
    await persistence.profiles.setActiveId(profile.id);

    const realSetActiveId = persistence.profiles.setActiveId;
    let invocations = 0;
    persistence.profiles.setActiveId = (id) => {
      invocations += 1;
      if (invocations === 1) return Promise.reject(new Error("simulated"));
      return realSetActiveId(id);
    };

    await expect(deleteProfile(persistence, profile.id)).rejects.toThrow(
      "simulated"
    );

    expect(await persistence.profiles.getById(profile.id)).toEqual(profile);
    expect(await persistence.profiles.getActiveId()).toBe(profile.id);
  });
});
