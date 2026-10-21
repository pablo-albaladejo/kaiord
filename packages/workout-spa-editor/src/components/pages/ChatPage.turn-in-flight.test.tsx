import type { ChatTurnResult } from "@kaiord/ai";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test-utils";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
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
  useChatMessagesLive: vi.fn(() => []),
}));
vi.mock("../../hooks/use-chat-conversations-live", () => ({
  useChatConversationsLive: vi.fn(),
}));
vi.mock("../../hooks/chat/build-chat-agent", () => ({
  buildChatAgent: vi.fn(),
}));
vi.mock("../../application/chat/ensure-conversation", () => ({
  ensureConversationForTurn: vi.fn(async () => undefined),
}));
vi.mock("../../application/chat/append-turn-messages", () => ({
  appendUserMessage: vi.fn(async () => undefined),
  appendAssistantTurn: vi.fn(async () => undefined),
}));

const { useAiProvidersLive } =
  await import("../../hooks/use-ai-providers-live");
const { useChatConversationsLive } =
  await import("../../hooks/use-chat-conversations-live");
const { buildChatAgent } = await import("../../hooks/chat/build-chat-agent");
const { appendAssistantTurn } =
  await import("../../application/chat/append-turn-messages");

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

describe("ChatPage turn in flight across a conversation switch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiProvidersLive).mockReturnValue([provider]);
    vi.mocked(useChatConversationsLive).mockReturnValue([
      conversation("c1", "Cycling"),
      conversation("c2", "Running"),
    ]);
  });

  it("should stop the turn on leaving its conversation, save it there as aborted and show nothing in the other", async () => {
    // Arrange
    vi.mocked(buildChatAgent).mockImplementation(async (args) => ({
      agent: {
        sendTurn: (_messages: unknown, options: { signal: AbortSignal }) => {
          args.onTextDelta?.("Respuesta para c1");
          return new Promise<ChatTurnResult>((resolve) =>
            options.signal.addEventListener("abort", () =>
              resolve({
                status: "aborted",
                text: "Respuesta para c1",
                messages: [],
              } as ChatTurnResult)
            )
          );
        },
      } as never,
      tools: [],
    }));
    const { rerender } = renderWithProviders(<ChatPage conversationId="c1" />);
    await userEvent.type(screen.getByLabelText("Message"), "hola{Enter}");
    await screen.findByText("Respuesta para c1");

    // Act
    await act(async () => rerender(<ChatPage conversationId="c2" />));

    // Assert
    await vi.waitFor(() =>
      expect(vi.mocked(appendAssistantTurn)).toHaveBeenCalledWith(
        expect.anything(),
        "p1",
        "c1",
        expect.objectContaining({
          status: "aborted",
          text: "Respuesta para c1",
        })
      )
    );
    expect(screen.queryByText("Respuesta para c1")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeEnabled();
  });
});
