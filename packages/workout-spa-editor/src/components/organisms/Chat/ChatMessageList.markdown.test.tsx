import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { ChatMessageList } from "./ChatMessageList";
import { ChatTurnExtras } from "./ChatTurnExtras";

const record = (
  role: ChatMessageRecord["role"],
  content: string
): ChatMessageRecord => ({
  id: `m-${role}`,
  profileId: "p1",
  conversationId: "c1",
  role,
  content,
  createdAt: "2026-10-17T10:00:00.000Z",
});

describe("chat markdown rendering", () => {
  it("should render assistant markdown and keep user text plain", () => {
    // Arrange
    const { hook } = memoryLocation({ path: "/chat" });
    const list = [
      record("user", "**mine**"),
      record("assistant", "**theirs**"),
    ];

    // Act
    render(
      <Router hook={hook}>
        <ChatMessageList messages={list} />
      </Router>
    );

    // Assert
    expect(screen.getByText("theirs").tagName).toBe("STRONG");
    expect(screen.getByText("**mine**").tagName).toBe("LI");
  });

  it("should render the streaming bubble as markdown", () => {
    // Arrange
    const noop = () => undefined;

    // Act
    render(
      <ChatTurnExtras
        busy
        streamingText={"- uno\n- dos"}
        pendingAction={null}
        error={null}
        onApprove={noop}
        onDeny={noop}
        onRetry={noop}
      />
    );

    // Assert
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
