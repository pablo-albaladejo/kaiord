import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { ChatMessageList } from "./ChatMessageList";

const message = (id: string, content: string): ChatMessageRecord => ({
  id,
  profileId: "p1",
  conversationId: "c1",
  role: "assistant",
  content,
  createdAt: "2026-06-13T10:00:00.000Z",
});

const messages = [message("m1", "first"), message("m2", "second")];

describe("ChatMessageList", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("should ring the focused message and scroll it into view", () => {
    // Arrange
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");

    // Act
    render(<ChatMessageList messages={messages} focusMessageId="m2" />);

    // Assert
    const focused = screen.getByText("second").closest("li");
    expect(focused?.getAttribute("data-focused")).toBe("true");
    expect(focused?.className).toContain("ring-yellow-300");
    expect(scroll).toHaveBeenCalled();
  });

  it("should not ring any message when no message is focused", () => {
    // Arrange
    const focusMessageId = null;

    // Act
    render(
      <ChatMessageList messages={messages} focusMessageId={focusMessageId} />
    );

    // Assert
    expect(screen.getByText("first").closest("li")?.className).not.toContain(
      "ring-yellow-300"
    );
  });
});
