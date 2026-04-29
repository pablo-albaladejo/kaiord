import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { ProfileNotFoundError } from "./errors";
import { makeProfile, seedProfile } from "./test-fixtures";
import { updateProfile } from "./update-profile";

describe("updateProfile", () => {
  it("applies name and bodyWeight updates and bumps updatedAt", async () => {
    const persistence = createInMemoryPersistence();
    const original = makeProfile({ name: "Original", bodyWeight: 70 });
    await seedProfile(persistence, original);

    const updated = await updateProfile(persistence, original.id, {
      name: "Renamed",
      bodyWeight: 72,
    });

    expect(updated.name).toBe("Renamed");
    expect(updated.bodyWeight).toBe(72);
    expect(updated.updatedAt).not.toBe(original.updatedAt);
    const stored = await persistence.profiles.getById(original.id);
    expect(stored?.name).toBe("Renamed");
  });

  it("throws ProfileNotFoundError for an unknown id", async () => {
    const persistence = createInMemoryPersistence();

    await expect(
      updateProfile(persistence, "missing-id", { name: "X" })
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});
