import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { ProfileNotFoundError } from "./errors";
import { makeProfile, seedProfile } from "./test-fixtures";
import { updateProfile } from "./update-profile";

describe("updateProfile", () => {
  it("should apply name and bodyWeight updates and bumps updatedAt", async () => {
    // Arrange
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

    // Act
    const stored = await persistence.profiles.getById(original.id);

    // Assert
    expect(stored?.name).toBe("Renamed");
  });

  it("should throw ProfileNotFoundError for an unknown id", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      updateProfile(persistence, "missing-id", { name: "X" })
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});
