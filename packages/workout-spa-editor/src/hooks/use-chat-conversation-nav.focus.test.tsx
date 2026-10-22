import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { ROUTE_HEADING_ATTR } from "../routing/constants";
import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";
import { useChatConversationNav } from "./use-chat-conversation-nav";
import { useFocusOnRouteChange } from "./use-focus-on-route-change";

const persisted = (id: string): ChatConversationRecord => ({
  id,
  profileId: "p1",
  title: "Cycling",
  createdAt: "2026-06-13T10:00:00.000Z",
  updatedAt: "2026-06-13T10:00:00.000Z",
});

function ChatHarness({
  conversations,
}: {
  conversations: ChatConversationRecord[];
}) {
  useFocusOnRouteChange();
  useChatConversationNav(conversations, undefined);
  return (
    <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }}>
      Assistant
    </h1>
  );
}

describe("useChatConversationNav focus", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "d-1" as ReturnType<typeof crypto.randomUUID>
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not move focus to the heading when the draft's first message persists it", async () => {
    // Arrange
    const location = memoryLocation({ path: "/chat", record: true });
    const tree = (conversations: ChatConversationRecord[]) => (
      <Router hook={location.hook}>
        <ChatHarness conversations={conversations} />
      </Router>
    );
    const { rerender, getByRole } = render(tree([]));
    const heading = getByRole("heading");
    await waitFor(() => expect(document.activeElement).toBe(heading));
    heading.blur();

    // Act
    rerender(tree([persisted("d-1")]));

    // Assert
    expect(document.activeElement).not.toBe(heading);
    expect(location.history).toEqual(["/chat/d-1"]);
  });
});
