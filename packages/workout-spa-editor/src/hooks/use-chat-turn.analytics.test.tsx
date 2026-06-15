/**
 * Count-only chat analytics: a message-sent event per user turn and a
 * tool-confirmed event per approved action. No message content reaches
 * analytics (spa-ai-chat usage rule — count-only events).
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../store/ai-store-types";
import { useChatTurn } from "./use-chat-turn";

const mockEvent = vi.fn();
const mockSendTurn = vi.fn();
const mockApproveAction = vi.fn();

vi.mock("../contexts/analytics-context", () => ({
  useAnalytics: () => ({ event: mockEvent, pageView: vi.fn() }),
}));
vi.mock("../contexts/persistence-context", () => ({
  usePersistence: () => ({}),
}));
vi.mock("./use-chat-action-ops", () => ({
  useChatActionOps: () => ({}),
}));
vi.mock("./chat/chat-turn-runner", () => ({
  sendTurn: (...args: unknown[]) => mockSendTurn(...args),
  approveAction: (...args: unknown[]) => mockApproveAction(...args),
  denyAction: vi.fn(),
}));

const provider: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  label: "A",
  isDefault: true,
  createdAt: 1,
};

const args = {
  profileId: "prof-1",
  provider,
  modelId: "claude-sonnet-4-6",
  generationProvider: provider,
  generationModelId: "claude-sonnet-4-6",
  today: "2026-06-15",
  messages: [],
};

describe("useChatTurn analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should emit a count-only chat-message-sent event on send", () => {
    // Arrange
    const { result } = renderHook(() => useChatTurn(args));

    // Act
    act(() => result.current.send("how far did I run last week?"));

    // Assert
    expect(mockEvent).toHaveBeenCalledWith("chat-message-sent");
    expect(mockSendTurn).toHaveBeenCalledTimes(1);
  });

  it("should not emit for a blank message", () => {
    // Arrange
    const { result } = renderHook(() => useChatTurn(args));

    // Act
    act(() => result.current.send("   "));

    // Assert
    expect(mockEvent).not.toHaveBeenCalled();
  });

  it("should emit chat-tool-confirmed with the tool name on approval", () => {
    // Arrange
    mockSendTurn.mockImplementation(
      (ctx: { set: { pendingAction: (p: unknown) => void } }) => {
        ctx.set.pendingAction({
          toolCallId: "tc-1",
          toolName: "create_workout",
          input: {},
        });
      }
    );
    const { result } = renderHook(() => useChatTurn(args));
    act(() => result.current.send("make me a recovery ride"));

    // Act
    act(() => result.current.approve());

    // Assert
    expect(mockEvent).toHaveBeenCalledWith("chat-tool-confirmed", {
      tool: "create_workout",
    });
    expect(mockApproveAction).toHaveBeenCalledTimes(1);
  });
});
