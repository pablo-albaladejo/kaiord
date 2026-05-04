import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { setActiveProfile } from "./set-active-profile";

describe("setActiveProfile", () => {
  it("should set the active id", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await setActiveProfile(persistence, "abc-123");

    // Assert
    expect(await persistence.profiles.getActiveId()).toBe("abc-123");
  });

  it("should clear the active id when null is passed", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.setActiveId("abc-123");

    // Act
    await setActiveProfile(persistence, null);

    // Assert
    expect(await persistence.profiles.getActiveId()).toBeNull();
  });

  it("should propagate rejections from the persistence port", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    persistence.profiles.setActiveId = () =>
      Promise.reject(new Error("simulated quota exceeded"));

    // Assert
    await expect(setActiveProfile(persistence, "abc-123")).rejects.toThrow(
      "simulated quota exceeded"
    );
  });
});
