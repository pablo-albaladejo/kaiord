import { describe, expect, it } from "vitest";

import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { buildToolResultLinks } from "./build-tool-result-links";

const toolMessage = (
  over: Partial<ChatMessageRecord> = {}
): ChatMessageRecord => ({
  id: "m1",
  profileId: "p1",
  conversationId: "c1",
  role: "tool",
  content: "Ran create_workout.",
  toolName: "create_workout",
  createdAt: "2026-06-13T10:00:00.000Z",
  ...over,
});

describe("buildToolResultLinks", () => {
  it("should link to the created workout and its calendar week when dated", () => {
    // Arrange
    const message = toolMessage({
      toolResult: { workoutId: "w1", date: "2026-06-01" },
    });

    // Act
    const links = buildToolResultLinks(message);

    // Assert
    expect(links).toEqual([
      { href: "/workout/view/w1?from=chat", label: "View workout" },
      { href: "/calendar/2026-W23", label: "View on calendar" },
    ]);
  });

  it("should link only to the workout when no date is present", () => {
    // Arrange
    const message = toolMessage({ toolResult: { workoutId: "w2" } });

    // Act
    const links = buildToolResultLinks(message);

    // Assert
    expect(links).toEqual([
      { href: "/workout/view/w2?from=chat", label: "View workout" },
    ]);
  });

  it.each([
    {
      label: "the tool event is not create_workout",
      over: { toolName: "sync_coaching", toolResult: { synced: 3 } },
    },
    {
      label: "the tool result lacks a workoutId",
      over: { toolResult: { error: "boom" } },
    },
    { label: "the tool result is absent", over: {} },
  ])("should return no links when $label", ({ over }) => {
    // Arrange
    const message = toolMessage(over);

    // Act
    const links = buildToolResultLinks(message);

    // Assert
    expect(links).toEqual([]);
  });
});
