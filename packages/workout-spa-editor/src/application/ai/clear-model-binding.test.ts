/**
 * clearModelBinding — removes a single purpose binding for a profile.
 */
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { clearModelBinding } from "./clear-model-binding";

describe("clearModelBinding", () => {
  it("should remove the binding for the given purpose", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.aiModelBindings.put({
      profileId: "p-1",
      purpose: "chat",
      providerId: "prov-1",
      modelId: "m1",
      updatedAt: "2026-06-15T10:00:00.000Z",
    });

    // Act
    await clearModelBinding(persistence, "p-1", "chat");

    // Assert
    expect(await persistence.aiModelBindings.get("p-1", "chat")).toBeUndefined();
  });
});
