/**
 * AiModelBindingRepository contract test, exercised against the in-memory
 * adapter (the Dexie adapter shares the same observable behavior; its store
 * shape is covered by the v22 migration + cascade integration tests).
 */
import { describe, expect, it } from "vitest";

import { createInMemoryAiModelBindingRepository } from "../../test-utils/in-memory-ai-model-binding-repository";
import type { AiModelBinding } from "../../types/ai-model-binding";

const binding = (over: Partial<AiModelBinding> = {}): AiModelBinding => ({
  profileId: "p-1",
  purpose: "default",
  providerId: "prov-1",
  modelId: "claude-sonnet-4-6",
  updatedAt: "2026-06-15T10:00:00.000Z",
  ...over,
});

describe("AiModelBindingRepository (in-memory)", () => {
  it("should keep one row per profile and purpose, latest write wins", async () => {
    // Arrange
    const repo = createInMemoryAiModelBindingRepository();

    // Act
    await repo.put(binding({ modelId: "gpt-4o" }));
    await repo.put(binding({ modelId: "claude-opus-4-6" }));
    const all = await repo.getAll("p-1");

    // Assert
    expect(all).toHaveLength(1);
    expect(all[0]?.modelId).toBe("claude-opus-4-6");
  });

  it("should scope getAll to the requested profile", async () => {
    // Arrange
    const repo = createInMemoryAiModelBindingRepository();

    // Act
    await repo.put(binding({ profileId: "p-1" }));
    await repo.put(binding({ profileId: "p-2", purpose: "chat" }));
    const forP1 = await repo.getAll("p-1");

    // Assert
    expect(forP1.map((b) => b.profileId)).toEqual(["p-1"]);
  });

  it("should return undefined for an unset purpose", async () => {
    // Arrange
    const repo = createInMemoryAiModelBindingRepository();

    // Act
    const found = await repo.get("p-1", "chat");

    // Assert
    expect(found).toBeUndefined();
  });

  it("should delete a single binding by purpose", async () => {
    // Arrange
    const repo = createInMemoryAiModelBindingRepository();
    await repo.put(binding({ purpose: "default" }));
    await repo.put(binding({ purpose: "chat" }));

    // Act
    await repo.delete("p-1", "chat");
    const all = await repo.getAll("p-1");

    // Assert
    expect(all.map((b) => b.purpose)).toEqual(["default"]);
  });

  it("should bulk-delete every binding for a profile", async () => {
    // Arrange
    const repo = createInMemoryAiModelBindingRepository();
    await repo.put(binding({ profileId: "p-1", purpose: "default" }));
    await repo.put(binding({ profileId: "p-1", purpose: "chat" }));
    await repo.put(binding({ profileId: "p-2", purpose: "default" }));

    // Act
    await repo.deleteByProfile("p-1");

    // Assert
    expect(await repo.getAll("p-1")).toHaveLength(0);
    expect(await repo.getAll("p-2")).toHaveLength(1);
  });
});
