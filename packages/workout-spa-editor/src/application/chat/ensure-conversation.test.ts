import { beforeEach, describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { ensureConversationForTurn } from "./ensure-conversation";

const NOW = () => new Date("2026-06-19T12:00:00.000Z");
const LATER = () => new Date("2026-06-19T13:00:00.000Z");

describe("ensureConversationForTurn", () => {
  let port: PersistencePort;

  beforeEach(() => {
    port = createInMemoryPersistence();
  });

  it("should create a conversation on the first message with a derived title", async () => {
    // Arrange

    // Act
    await ensureConversationForTurn(
      port,
      {
        profileId: "p1",
        conversationId: "c1",
        firstMessageText: "  Plan my taper week  ",
        model: { providerId: "prov-1", modelId: "claude" },
      },
      NOW
    );

    // Assert
    const row = await port.chatConversations.get("p1", "c1");
    expect(row).toMatchObject({
      id: "c1",
      profileId: "p1",
      title: "Plan my taper week",
      createdAt: "2026-06-19T12:00:00.000Z",
      updatedAt: "2026-06-19T12:00:00.000Z",
      providerId: "prov-1",
      modelId: "claude",
    });
  });

  it("should advance updatedAt without changing the title when present", async () => {
    // Arrange
    await ensureConversationForTurn(
      port,
      { profileId: "p1", conversationId: "c1", firstMessageText: "First" },
      NOW
    );

    // Act
    await ensureConversationForTurn(
      port,
      { profileId: "p1", conversationId: "c1", firstMessageText: "Second" },
      LATER
    );

    // Assert
    const row = await port.chatConversations.get("p1", "c1");
    expect(row?.title).toBe("First");
    expect(row?.createdAt).toBe("2026-06-19T12:00:00.000Z");
    expect(row?.updatedAt).toBe("2026-06-19T13:00:00.000Z");
  });
});
