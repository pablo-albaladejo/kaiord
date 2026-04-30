import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { setCustomPrompt } from "./set-custom-prompt";

describe("setCustomPrompt", () => {
  it("persists the prompt and exposes it through the repository", async () => {
    const persistence = createInMemoryPersistence();

    await setCustomPrompt(persistence, "knee injury context");

    expect(await persistence.aiProviders.getCustomPrompt()).toBe(
      "knee injury context"
    );
  });

  it("preserves the empty-string clear case as a distinct value", async () => {
    const persistence = createInMemoryPersistence();
    await setCustomPrompt(persistence, "first prompt");

    await setCustomPrompt(persistence, "");

    expect(await persistence.aiProviders.getCustomPrompt()).toBe("");
  });
});
