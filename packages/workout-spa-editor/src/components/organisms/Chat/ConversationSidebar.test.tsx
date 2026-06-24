import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ChatConversationRecord } from "../../../types/chat/chat-conversation-record";
import { ConversationSidebar } from "./ConversationSidebar";

const conversations: ChatConversationRecord[] = [
  {
    id: "c1",
    profileId: "p1",
    title: "Cycling",
    createdAt: "2026-06-13T10:00:00.000Z",
    updatedAt: "2026-06-13T10:00:00.000Z",
  },
];

const baseProps = {
  conversations,
  activeId: null,
  searchQuery: "",
  searchActive: false,
  searchResults: [],
  onSearchChange: vi.fn(),
  onResultSelect: vi.fn(),
  onSelect: vi.fn(),
  onNew: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
};

describe("ConversationSidebar", () => {
  it("should show the conversation list when search is inactive", () => {
    // Arrange
    const props = { ...baseProps, searchActive: false };

    // Act
    render(<ConversationSidebar {...props} />);

    // Assert
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-search-results")).not.toBeInTheDocument();
  });

  it("should replace the list with results when search is active", () => {
    // Arrange
    const props = {
      ...baseProps,
      searchActive: true,
      searchQuery: "umbral",
      searchResults: [
        {
          conversationId: "c1",
          title: "Cycling",
          titleMatch: true,
          messageMatches: [],
        },
      ],
    };

    // Act
    render(<ConversationSidebar {...props} />);

    // Assert
    expect(screen.getByTestId("chat-search-results")).toBeInTheDocument();
    expect(screen.queryByTestId("conversation-list")).not.toBeInTheDocument();
  });

  it("should call onSearchChange when typing in the search box", async () => {
    // Arrange
    const onSearchChange = vi.fn();
    render(
      <ConversationSidebar {...baseProps} onSearchChange={onSearchChange} />
    );

    // Act
    await userEvent.type(screen.getByTestId("chat-search-input"), "u");

    // Assert
    expect(onSearchChange).toHaveBeenCalledWith("u");
  });
});
