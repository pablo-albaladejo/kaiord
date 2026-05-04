import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { removeProvider } from "./remove-provider";
import { baseProvider, secondProvider } from "./test-fixtures";

describe("removeProvider", () => {
  it("should delete the target and promotes the next provider when the deleted was default (I2)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const first = await addProvider(persistence, baseProvider);
    const second = await addProvider(persistence, secondProvider);
    await removeProvider(persistence, first.id);

    // Act
    const all = await persistence.aiProviders.getAll();

    // Assert
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(second.id);
    expect(all[0].isDefault).toBe(true);
  });

  it("should leave the existing default untouched when removing a non-default provider", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const first = await addProvider(persistence, baseProvider);
    const second = await addProvider(persistence, secondProvider);
    await removeProvider(persistence, second.id);

    // Act
    const all = await persistence.aiProviders.getAll();

    // Assert
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(first.id);
    expect(all[0].isDefault).toBe(true);
  });

  it("should be a no-op when the target id does not exist", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, baseProvider);

    // Act
    await removeProvider(persistence, "missing-id");

    // Assert
    expect(await persistence.aiProviders.getAll()).toHaveLength(1);
  });
});
