import { describe, expect, it } from "vitest";

import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";
import { createInMemoryChatConversationRepository } from "./in-memory-chat-conversation-repository";

const conv = (
  id: string,
  profileId: string,
  updatedAt: string
): ChatConversationRecord => ({
  id,
  profileId,
  title: id,
  createdAt: "2026-06-13T10:00:00.000Z",
  updatedAt,
});

const PROFILE_A = "profile-a";

describe("createInMemoryChatConversationRepository", () => {
  it("should list conversations most-recently-updated first", async () => {
    // Arrange
    const repo = createInMemoryChatConversationRepository();
    await repo.put(conv("c1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.put(conv("c2", PROFILE_A, "2026-06-13T10:03:00.000Z"));
    await repo.put(conv("c3", PROFILE_A, "2026-06-13T10:02:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A);

    // Assert
    expect(result.map((c) => c.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("should return undefined for a foreign profile id", async () => {
    // Arrange
    const repo = createInMemoryChatConversationRepository();
    await repo.put(conv("c1", PROFILE_A, "2026-06-13T10:01:00.000Z"));

    // Act
    const result = await repo.get("other", "c1");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should bulk-delete every conversation for a profile", async () => {
    // Arrange
    const repo = createInMemoryChatConversationRepository();
    await repo.put(conv("c1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.put(conv("b1", "p-B", "2026-06-13T10:01:00.000Z"));

    // Act
    await repo.deleteByProfile(PROFILE_A);

    // Assert
    expect(await repo.listByProfile(PROFILE_A)).toEqual([]);
    expect((await repo.listByProfile("p-B")).map((c) => c.id)).toEqual(["b1"]);
  });
});
