import { describe, expect, it } from "vitest";

import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { searchConversations } from "./search-conversations";

const conv = (
  id: string,
  title: string,
  updatedAt = "2026-01-01T00:00:00.000Z"
): ChatConversationRecord => ({
  id,
  profileId: "p1",
  title,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt,
});

const msg = (
  id: string,
  conversationId: string,
  content: string,
  role: ChatMessageRecord["role"] = "user"
): ChatMessageRecord => ({
  id,
  profileId: "p1",
  conversationId,
  role,
  content,
  createdAt: `2026-01-01T00:00:0${id.slice(-1)}.000Z`,
});

describe("searchConversations", () => {
  it("should match when tokens are spread across different messages", () => {
    // Arrange
    const conversations = [conv("c1", "Plan")];
    const messages = [
      msg("m1", "c1", "trabajar el umbral"),
      msg("m2", "c1", "y mejorar el vo2max"),
    ];

    // Act
    const results = searchConversations("umbral vo2", conversations, messages);

    // Assert
    expect(results.map((r) => r.conversationId)).toEqual(["c1"]);
  });

  it("should exclude a conversation missing one token", () => {
    // Arrange
    const conversations = [conv("c1", "Plan")];
    const messages = [msg("m1", "c1", "solo hablo de umbral")];

    // Act
    const results = searchConversations("umbral vo2", conversations, messages);

    // Assert
    expect(results).toEqual([]);
  });

  it("should match a token as a substring of a longer word", () => {
    // Arrange
    const conversations = [conv("c1", "Plan")];
    const messages = [msg("m1", "c1", "mejorar el vo2max esta semana")];

    // Act
    const results = searchConversations("vo2", conversations, messages);

    // Assert
    expect(results).toHaveLength(1);
  });

  it("should match accent-insensitively", () => {
    // Arrange
    const conversations = [conv("c1", "Plan")];
    const messages = [msg("m1", "c1", "cerca del úmbral funcional")];

    // Act
    const results = searchConversations("umbral", conversations, messages);

    // Assert
    expect(results).toHaveLength(1);
  });

  it("should match on the title alone", () => {
    // Arrange
    const conversations = [conv("c1", "Bloque de umbral")];
    const messages = [msg("m1", "c1", "sin relacion")];

    // Act
    const results = searchConversations("umbral", conversations, messages);

    // Assert
    expect(results[0]?.titleMatch).toBe(true);
  });

  it("should rank a title match above a content-only match", () => {
    // Arrange
    const conversations = [conv("c1", "no relevante"), conv("c2", "umbral")];
    const messages = [msg("m1", "c1", "hablamos de umbral aqui")];

    // Act
    const results = searchConversations("umbral", conversations, messages);

    // Assert
    expect(results.map((r) => r.conversationId)).toEqual(["c2", "c1"]);
  });

  it("should rank a more frequent match higher", () => {
    // Arrange
    const conversations = [conv("c1", "a"), conv("c2", "b")];
    const messages = [
      msg("m1", "c1", "umbral"),
      msg("m2", "c2", "umbral umbral umbral"),
    ];

    // Act
    const results = searchConversations("umbral", conversations, messages);

    // Assert
    expect(results.map((r) => r.conversationId)).toEqual(["c2", "c1"]);
  });

  it("should break score ties by recency", () => {
    // Arrange
    const conversations = [
      conv("c1", "a", "2026-01-01T00:00:00.000Z"),
      conv("c2", "b", "2026-02-01T00:00:00.000Z"),
    ];
    const messages = [msg("m1", "c1", "umbral"), msg("m2", "c2", "umbral")];

    // Act
    const results = searchConversations("umbral", conversations, messages);

    // Assert
    expect(results.map((r) => r.conversationId)).toEqual(["c2", "c1"]);
  });

  it("should order messages matching more tokens first", () => {
    // Arrange
    const conversations = [conv("c1", "Plan")];
    const messages = [
      msg("m1", "c1", "solo umbral"),
      msg("m2", "c1", "umbral y vo2 juntos"),
    ];

    // Act
    const results = searchConversations("umbral vo2", conversations, messages);

    // Assert
    expect(results[0].messageMatches.map((m) => m.messageId)).toEqual([
      "m2",
      "m1",
    ]);
  });

  it("should return no results for an empty query", () => {
    // Arrange
    const conversations = [conv("c1", "umbral")];
    const messages = [msg("m1", "c1", "umbral")];

    // Act
    const results = searchConversations("  a ", conversations, messages);

    // Assert
    expect(results).toEqual([]);
  });
});
