import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

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

function renderWithRouter(list: ChatMessageRecord[]) {
  const { hook } = memoryLocation({ path: "/chat", record: true });
  return render(
    <Router hook={hook}>
      <ChatMessageList messages={list} />
    </Router>
  );
}

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

  it("should render deep-links for a create_workout tool-event message", () => {
    // Arrange
    const toolMessage: ChatMessageRecord = {
      id: "m3",
      profileId: "p1",
      conversationId: "c1",
      role: "tool",
      content: "Ran create_workout.",
      toolName: "create_workout",
      toolResult: { workoutId: "w1", date: "2026-06-01" },
      createdAt: "2026-06-13T10:05:00.000Z",
    };

    // Act
    renderWithRouter([toolMessage]);

    // Assert
    expect(screen.getByRole("link", { name: "View workout" })).toHaveAttribute(
      "href",
      "/workout/view/w1?from=chat"
    );
    expect(
      screen.getByRole("link", { name: "View on calendar" })
    ).toHaveAttribute("href", "/calendar/2026-W23");
  });

  it("should render no deep-links for a plain assistant message", () => {
    // Arrange

    // Act
    renderWithRouter(messages);

    // Assert
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
