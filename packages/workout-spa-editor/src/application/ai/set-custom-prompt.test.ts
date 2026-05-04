import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { setCustomPrompt } from "./set-custom-prompt";

describe("setCustomPrompt", () => {
  it("should persist the prompt and exposes it through the repository", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await setCustomPrompt(persistence, "knee injury context");

    // Assert
    expect(await persistence.aiProviders.getCustomPrompt()).toBe(
      "knee injury context"
    );
  });

  it("should preserve the empty-string clear case as a distinct value", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await setCustomPrompt(persistence, "first prompt");

    // Act
    await setCustomPrompt(persistence, "");

    // Assert
    expect(await persistence.aiProviders.getCustomPrompt()).toBe("");
  });
});
