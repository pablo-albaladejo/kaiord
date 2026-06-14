import { describe, expect, it } from "vitest";

import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { newChatMessage, recordsToModelMessages } from "./chat-message-mapper";

const record = (
  id: string,
  role: ChatMessageRecord["role"],
  content: string
): ChatMessageRecord => ({
  id,
  profileId: "p1",
  role,
  content,
  createdAt: "2026-06-13T10:00:00.000Z",
});

describe("recordsToModelMessages", () => {
  it("should map user and assistant records to model messages", () => {
    // Arrange
    const records = [record("1", "user", "hi"), record("2", "assistant", "yo")];

    // Act
    const messages = recordsToModelMessages(records);

    // Assert
    expect(messages).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "yo" },
    ]);
  });

  it("should drop tool-event records from the model context", () => {
    // Arrange
    const records = [record("1", "user", "hi"), record("2", "tool", "synced")];

    // Act
    const messages = recordsToModelMessages(records);

    // Assert
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
  });
});

describe("newChatMessage", () => {
  it("should omit optional fields when not provided", () => {
    // Arrange
    const input = {
      id: "1",
      profileId: "p1",
      role: "user" as const,
      content: "hi",
      createdAt: "2026-06-13T10:00:00.000Z",
    };

    // Act
    const result = newChatMessage(input);

    // Assert
    expect(result).not.toHaveProperty("usage");
    expect(result).not.toHaveProperty("toolName");
  });

  it("should carry usage and toolName when provided", () => {
    // Arrange
    const input = {
      id: "2",
      profileId: "p1",
      role: "assistant" as const,
      content: "done",
      createdAt: "2026-06-13T10:00:00.000Z",
      usage: { promptTokens: 5, completionTokens: 3 },
    };

    // Act
    const result = newChatMessage(input);

    // Assert
    expect(result.usage).toEqual({ promptTokens: 5, completionTokens: 3 });
  });
});
