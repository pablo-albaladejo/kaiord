import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { ProviderNotFoundError } from "./errors";
import { baseProvider } from "./test-fixtures";
import { updateProvider } from "./update-provider";

describe("updateProvider", () => {
  it("should merge the partial update onto the existing provider", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const created = await addProvider(persistence, baseProvider);

    // Act
    const updated = await updateProvider(persistence, created.id, {
      label: "Renamed",
      apiKey: "sk-renamed",
    });

    // Assert
    expect(updated.label).toBe("Renamed");
    expect(updated.apiKey).toBe("sk-renamed");
    expect(updated.id).toBe(created.id);
    expect(updated.isDefault).toBe(true);
  });

  it("should throw ProviderNotFoundError for unknown ids", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      updateProvider(persistence, "missing-id", { label: "Whatever" })
    ).rejects.toBeInstanceOf(ProviderNotFoundError);
  });

  it("should number a new name another account already carries", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, { ...baseProvider, label: "Work" });
    const other = await addProvider(persistence, {
      ...baseProvider,
      label: "Home",
    });

    // Act
    const renamed = await updateProvider(persistence, other.id, {
      label: "Work",
    });

    // Assert
    expect(renamed.label).toBe("Work 2");
  });

  it("should keep an account's own name when it is saved again", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const created = await addProvider(persistence, {
      ...baseProvider,
      label: "Work",
    });

    // Act
    const renamed = await updateProvider(persistence, created.id, {
      label: "Work",
    });

    // Assert
    expect(renamed.label).toBe("Work");
  });
});
