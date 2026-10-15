import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { AiModelPurpose } from "../../types/ai-model-binding";
import type { Profile } from "../../types/profile";
import { addProvider } from "./add-provider";
import { removeProvider } from "./remove-provider";
import { baseProvider, secondProvider } from "./test-fixtures";

const makeProfile = (id: string): Profile => ({
  id,
  name: id,
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

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
  it("should delete every athlete's bindings that point at the removed provider", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const kept = await addProvider(persistence, baseProvider);
    const removed = await addProvider(persistence, secondProvider);
    for (const id of ["p-1", "p-2"]) {
      await persistence.profiles.put(makeProfile(id));
    }
    const bind = (
      profileId: string,
      purpose: AiModelPurpose,
      providerId: string
    ) =>
      persistence.aiModelBindings.put({
        profileId,
        purpose,
        providerId,
        modelId: "m",
        updatedAt: "2026-10-15T00:00:00.000Z",
      });
    await bind("p-1", "default", removed.id);
    await bind("p-1", "chat", kept.id);
    await bind("p-2", "lab_extraction", removed.id);

    // Act
    await removeProvider(persistence, removed.id);

    // Assert
    const p1 = await persistence.aiModelBindings.getAll("p-1");
    const p2 = await persistence.aiModelBindings.getAll("p-2");
    expect(p1.map((b) => b.purpose)).toEqual(["chat"]);
    expect(p2).toEqual([]);
  });

  it("should roll the whole removal back when a binding delete fails", async () => {
    // Arrange
    const base = createInMemoryPersistence();
    const removed = await addProvider(base, baseProvider);
    await base.profiles.put(makeProfile("p-1"));
    await base.aiModelBindings.put({
      profileId: "p-1",
      purpose: "default",
      providerId: removed.id,
      modelId: "m",
      updatedAt: "2026-10-15T00:00:00.000Z",
    });
    const persistence = {
      ...base,
      aiModelBindings: {
        ...base.aiModelBindings,
        delete: () => Promise.reject(new Error("disk full")),
      },
    };

    // Act
    const removal = removeProvider(persistence, removed.id);

    // Assert
    await expect(removal).rejects.toThrow("disk full");
    expect(await base.aiProviders.getById(removed.id)).toBeDefined();
  });
});
