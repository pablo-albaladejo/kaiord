import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { setActiveProfile } from "./set-active-profile";

describe("setActiveProfile", () => {
  it("sets the active id", async () => {
    const persistence = createInMemoryPersistence();

    await setActiveProfile(persistence, "abc-123");

    expect(await persistence.profiles.getActiveId()).toBe("abc-123");
  });

  it("clears the active id when null is passed", async () => {
    const persistence = createInMemoryPersistence();
    await persistence.profiles.setActiveId("abc-123");

    await setActiveProfile(persistence, null);

    expect(await persistence.profiles.getActiveId()).toBeNull();
  });

  it("propagates rejections from the persistence port", async () => {
    const persistence = createInMemoryPersistence();
    persistence.profiles.setActiveId = () =>
      Promise.reject(new Error("simulated quota exceeded"));

    await expect(setActiveProfile(persistence, "abc-123")).rejects.toThrow(
      "simulated quota exceeded"
    );
  });
});
