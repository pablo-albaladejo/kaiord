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
});
