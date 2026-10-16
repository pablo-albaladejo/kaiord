import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { baseProvider, secondProvider } from "./test-fixtures";

describe("addProvider", () => {
  it("should mark the first provider as default (invariant I1)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const created = await addProvider(persistence, baseProvider);
    expect(created.isDefault).toBe(true);

    // Act
    const all = await persistence.aiProviders.getAll();

    // Assert
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it("should not promote subsequent providers to default", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const first = await addProvider(persistence, baseProvider);
    const second = await addProvider(persistence, secondProvider);
    expect(second.isDefault).toBe(false);

    // Act
    const all = await persistence.aiProviders.getAll();

    // Assert
    expect(all.find((p) => p.id === first.id)?.isDefault).toBe(true);
    expect(all.find((p) => p.id === second.id)?.isDefault).toBe(false);
  });

  it("should propagate persistence rejection so the caller can surface a toast", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const putSpy = vi
      .spyOn(persistence.aiProviders, "put")
      .mockRejectedValueOnce(new Error("disk full"));
    await expect(addProvider(persistence, baseProvider)).rejects.toThrow(
      "disk full"
    );
    expect(await persistence.aiProviders.getAll()).toHaveLength(0);

    // Act
    putSpy.mockRestore();

    // Assert
  });

  it("should stamp a numeric createdAt at the moment of creation", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const before = Date.now();
    const created = await addProvider(persistence, baseProvider);

    // Act
    const after = Date.now();

    // Assert
    expect(typeof created.createdAt).toBe("number");
    expect(created.createdAt).toBeGreaterThanOrEqual(before);
    expect(created.createdAt).toBeLessThanOrEqual(after);
  });

  it("should surface providers in insertion order via getAll", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    vi.useFakeTimers();

    // Assert
    try {
      vi.setSystemTime(new Date("2026-05-01T00:00:00.000Z"));
      const first = await addProvider(persistence, baseProvider);
      vi.setSystemTime(new Date("2026-05-01T00:00:00.500Z"));
      const second = await addProvider(persistence, secondProvider);

      const all = await persistence.aiProviders.getAll();

      expect(all.map((p) => p.id)).toEqual([first.id, second.id]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should name an unlabelled account after its provider, numbering repeats", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const unlabelled = { ...baseProvider, label: "  " };

    // Act
    const first = await addProvider(persistence, unlabelled);
    const second = await addProvider(persistence, unlabelled);
    const third = await addProvider(persistence, { ...unlabelled, label: "" });

    // Assert
    expect([first.label, second.label, third.label]).toEqual([
      "Anthropic",
      "Anthropic 2",
      "Anthropic 3",
    ]);
  });

  it("should keep a label the athlete typed, trimmed", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const created = await addProvider(persistence, {
      ...baseProvider,
      label: "  Work  ",
    });

    // Assert
    expect(created.label).toBe("Work");
  });

  it("should store how the key check ended", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const created = await addProvider(persistence, {
      ...baseProvider,
      keyCheck: "valid",
    });

    // Assert
    expect((await persistence.aiProviders.getById(created.id))?.keyCheck).toBe(
      "valid"
    );
  });

  it("should number a typed label another account already carries", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, { ...baseProvider, label: "Work" });

    // Act
    const second = await addProvider(persistence, {
      ...baseProvider,
      label: " Work ",
    });

    // Assert
    expect(second.label).toBe("Work 2");
  });
});
