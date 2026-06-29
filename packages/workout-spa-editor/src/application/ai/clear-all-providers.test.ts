import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { clearAllProviders } from "./clear-all-providers";
import { baseProvider, secondProvider } from "./test-fixtures";

describe("clearAllProviders", () => {
  it("should remove every provider", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, baseProvider);
    await addProvider(persistence, secondProvider);

    // Act
    await clearAllProviders(persistence);

    // Assert
    expect(await persistence.aiProviders.getAll()).toHaveLength(0);
  });

  it("should propagate persistence rejection so the caller can surface a toast", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, baseProvider);
    persistence.aiProviders.delete = async () => {
      throw new Error("disk full");
    };

    // Act
    const act = clearAllProviders(persistence);

    // Assert
    await expect(act).rejects.toThrow("disk full");
  });
});
