import { beforeEach, describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { deleteConversation } from "./delete-conversation";

const NOW = () => new Date("2026-06-19T12:00:00.000Z");

const conv = (id: string) => ({
  id,
  profileId: "p1",
  title: id,
  createdAt: "2026-06-19T10:00:00.000Z",
  updatedAt: "2026-06-19T10:00:00.000Z",
});

const msg = (id: string, conversationId: string): ChatMessageRecord => ({
  id,
  profileId: "p1",
  conversationId,
  role: "user",
  content: id,
  createdAt: "2026-06-19T10:00:00.000Z",
});

describe("deleteConversation", () => {
  let port: PersistencePort;

  beforeEach(async () => {
    port = createInMemoryPersistence();
    await port.chatConversations.put(conv("c1"));
    await port.chatConversations.put(conv("c2"));
    await port.chatMessages.append(msg("m1", "c1"));
    await port.chatMessages.append(msg("m2", "c1"));
    await port.chatMessages.append(msg("k1", "c2"));
  });

  it("should delete the target conversation's messages and row only", async () => {
    // Arrange

    // Act
    await deleteConversation(port, "p1", "c1", NOW);

    // Assert
    expect(await port.chatConversations.get("p1", "c1")).toBeUndefined();
    expect(await port.chatMessages.listByConversation("p1", "c1")).toHaveLength(
      0
    );
    expect(await port.chatConversations.get("p1", "c2")).toBeDefined();
    expect(await port.chatMessages.listByConversation("p1", "c2")).toHaveLength(
      1
    );
  });

  it("should tombstone the conversation row and each deleted message", async () => {
    // Arrange

    // Act
    await deleteConversation(port, "p1", "c1", NOW);

    // Assert
    const tombstones = await port.tombstones.list();
    const keys = tombstones.map((t) => `${t.table}:${t.id}`);
    expect(keys).toContain("chatConversations:c1");
    expect(keys).toContain("chatMessages:m1");
    expect(keys).toContain("chatMessages:m2");
  });
});
