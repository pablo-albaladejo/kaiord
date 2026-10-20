import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatTurnCtx } from "../../hooks/chat/chat-turn-types";
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
vi.mock("../../hooks/chat/chat-turn-runner", () => ({
  sendTurn: vi.fn(),
  retryTurn: vi.fn(),
}));

const { useAiProvidersLive } =
  await import("../../hooks/use-ai-providers-live");
const { useChatConversationsLive } =
  await import("../../hooks/use-chat-conversations-live");
const { sendTurn } = await import("../../hooks/chat/chat-turn-runner");
const mockSend = vi.mocked(sendTurn);

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

const sendInFirstConversation = async (
  turn: (ctx: ChatTurnCtx) => void
): Promise<(id: string) => void> => {
  mockSend.mockImplementation(async (ctx) => turn(ctx));
  const { rerender } = renderWithProviders(<ChatPage conversationId="c1" />);
  await userEvent.type(screen.getByLabelText("Message"), "hola{Enter}");
  return (id) => rerender(<ChatPage conversationId={id} />);
};

describe("ChatPage turn isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAiProvidersLive).mockReturnValue([provider]);
    vi.mocked(useChatConversationsLive).mockReturnValue([
      conversation("c1", "Cycling"),
      conversation("c2", "Running"),
    ]);
  });

  it("should not show one conversation's error and retry in another", async () => {
    // Arrange
    const switchTo = await sendInFirstConversation((ctx) => {
      ctx.set.error("network");
      ctx.set.state("error");
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Act
    switchTo("c2");

    // Assert
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" })
    ).not.toBeInTheDocument();
  });

  it("should not show one conversation's pending action in another", async () => {
    // Arrange
    const switchTo = await sendInFirstConversation((ctx) => {
      ctx.set.pendingAction({
        toolName: "create_workout",
        toolCallId: "t1",
        input: {},
      });
      ctx.set.state("awaiting_confirmation");
    });
    expect(screen.getByRole("button", { name: "Approve" })).toBeVisible();

    // Act
    switchTo("c2");

    // Assert
    expect(
      screen.queryByRole("button", { name: "Approve" })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeEnabled();
  });

  it("should not stream one conversation's reply into another", async () => {
    // Arrange
    const switchTo = await sendInFirstConversation((ctx) => {
      ctx.set.state("streaming");
      ctx.set.streamingText("Respuesta parcial");
    });
    expect(screen.getByText("Respuesta parcial")).toBeInTheDocument();

    // Act
    switchTo("c2");

    // Assert
    expect(screen.queryByText("Respuesta parcial")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeEnabled();
  });

  it("should seed an adjust-with-AI prefill only into the conversation it opened", () => {
    // Arrange
    window.history.replaceState(null, "", "/chat?prefill=Ajusta%20el%20rodaje");
    const { rerender } = renderWithProviders(<ChatPage conversationId="c1" />);
    expect(screen.getByLabelText("Message")).toHaveValue("Ajusta el rodaje");

    // Act
    rerender(<ChatPage conversationId="c2" />);
    const inSecond = (screen.getByLabelText("Message") as HTMLTextAreaElement)
      .value;
    rerender(<ChatPage conversationId="c1" />);

    // Assert
    expect(inSecond).toBe("");
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });
});
