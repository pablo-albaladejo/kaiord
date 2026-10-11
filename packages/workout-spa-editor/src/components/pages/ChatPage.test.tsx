import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { renderWithProviders } from "../../test-utils";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import ChatPage from "./ChatPage";

vi.mock("../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: vi.fn(() => ({ id: "p1", profile: null })),
}));
vi.mock("../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: vi.fn(),
}));
vi.mock("../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: vi.fn(() => []),
}));
vi.mock("../../hooks/use-chat-messages-live", () => ({
  useChatMessagesLive: vi.fn(),
}));
vi.mock("../../hooks/use-chat-conversations-live", () => ({
  useChatConversationsLive: vi.fn(),
}));

const { useActiveProfileLive } =
  await import("../../hooks/use-active-profile-live");
const { useAiProvidersLive } =
  await import("../../hooks/use-ai-providers-live");
const { useChatMessagesLive } =
  await import("../../hooks/use-chat-messages-live");
const { useChatConversationsLive } =
  await import("../../hooks/use-chat-conversations-live");
const mockActive = vi.mocked(useActiveProfileLive);
const mockProviders = vi.mocked(useAiProvidersLive);
const mockMessages = vi.mocked(useChatMessagesLive);
const mockConversations = vi.mocked(useChatConversationsLive);

const provider = {
  id: "ai-1",
  type: "anthropic" as const,
  apiKey: "k",
  model: "claude",
  label: "Claude",
  isDefault: true,
  createdAt: 1,
};

const conversation = (id: string, title: string): ChatConversationRecord => ({
  id,
  profileId: "p1",
  title,
  createdAt: "2026-06-13T10:00:00.000Z",
  updatedAt: "2026-06-13T10:00:00.000Z",
});

const message = (id: string, content: string): ChatMessageRecord => ({
  id,
  profileId: "p1",
  conversationId: "c1",
  role: "assistant",
  content,
  createdAt: "2026-06-13T10:00:00.000Z",
});

describe("ChatPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActive.mockReturnValue({ id: "p1", profile: null });
  });

  it("should render the route heading with the route-heading attribute", () => {
    // Arrange
    mockProviders.mockReturnValue([provider]);
    mockConversations.mockReturnValue([]);
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
    mockConversations.mockReturnValue([]);
    mockMessages.mockReturnValue([]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    expect(screen.getByText(/Configure an AI provider/i)).toBeInTheDocument();
  });

  it("should render the active conversation transcript", () => {
    // Arrange
    mockProviders.mockReturnValue([provider]);
    mockConversations.mockReturnValue([conversation("c1", "Cycling")]);
    mockMessages.mockReturnValue([message("m1", "Your longest ride was 2h")]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    expect(screen.getByText("Your longest ride was 2h")).toBeInTheDocument();
  });

  it("should list the profile's conversations", () => {
    // Arrange
    mockProviders.mockReturnValue([provider]);
    mockConversations.mockReturnValue([
      conversation("c1", "Cycling"),
      conversation("c2", "Running"),
    ]);
    mockMessages.mockReturnValue([]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    expect(screen.getByText("Cycling")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("should prompt to pick a conversation for an unknown deep link", () => {
    // Arrange
    mockProviders.mockReturnValue([provider]);
    mockConversations.mockReturnValue([conversation("c1", "Cycling")]);
    mockMessages.mockReturnValue([]);

    // Act
    renderWithProviders(<ChatPage conversationId="missing" />);

    // Assert
    expect(screen.getByText(/Select a conversation/i)).toBeInTheDocument();
  });

  it("should send a user without a profile to create one", () => {
    // Arrange
    mockActive.mockReturnValue({ id: null, profile: null });
    mockProviders.mockReturnValue([provider]);
    mockConversations.mockReturnValue([]);
    mockMessages.mockReturnValue([]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    const gate = screen.getByTestId("chat-gate-noProfile");
    expect(gate).toHaveTextContent("needs an athlete profile");
    expect(
      screen.getByRole("button", { name: "Create a profile" })
    ).toBeVisible();
    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  });

  it("should name the provider whose key is missing instead of offering it", () => {
    // Arrange
    mockProviders.mockReturnValue([
      { ...provider, apiKey: "", apiKeyMissing: true, label: "Restored" },
    ]);
    mockConversations.mockReturnValue([]);
    mockMessages.mockReturnValue([]);

    // Act
    renderWithProviders(<ChatPage />);

    // Assert
    const gate = screen.getByTestId("chat-gate-missingKey");
    expect(gate).toHaveTextContent("“Restored” came from a backup");
    expect(screen.getByRole("button", { name: "Add the key" })).toBeVisible();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
