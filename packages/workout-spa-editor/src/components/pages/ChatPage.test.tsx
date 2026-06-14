import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { renderWithProviders } from "../../test-utils";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import ChatPage from "./ChatPage";

vi.mock("../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1", profile: null }),
}));
vi.mock("../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: vi.fn(),
}));
vi.mock("../../hooks/use-chat-messages-live", () => ({
  useChatMessagesLive: vi.fn(),
}));

const { useAiProvidersLive } =
  await import("../../hooks/use-ai-providers-live");
const { useChatMessagesLive } =
  await import("../../hooks/use-chat-messages-live");
const mockProviders = vi.mocked(useAiProvidersLive);
const mockMessages = vi.mocked(useChatMessagesLive);

const provider = {
  id: "ai-1",
  type: "anthropic" as const,
  apiKey: "k",
  model: "claude",
  label: "Claude",
  isDefault: true,
  createdAt: 1,
};

const message = (id: string, content: string): ChatMessageRecord => ({
  id,
  profileId: "p1",
  role: "assistant",
  content,
  createdAt: "2026-06-13T10:00:00.000Z",
});

describe("ChatPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should render the route heading with the route-heading attribute", () => {
    // Arrange
    mockProviders.mockReturnValue([provider]);
    mockMessages.mockReturnValue([]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    const heading = screen.getByRole("heading", { name: "Assistant" });
    expect(heading.hasAttribute(ROUTE_HEADING_ATTR)).toBe(true);
  });

  it("should show the no-provider empty state when none are configured", () => {
    // Arrange
    mockProviders.mockReturnValue([]);
    mockMessages.mockReturnValue([]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    expect(screen.getByText(/Configure an AI provider/i)).toBeInTheDocument();
  });

  it("should render the persisted transcript when providers exist", () => {
    // Arrange
    mockProviders.mockReturnValue([provider]);
    mockMessages.mockReturnValue([message("m1", "Your longest ride was 2h")]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    expect(screen.getByText("Your longest ride was 2h")).toBeInTheDocument();
  });
});
