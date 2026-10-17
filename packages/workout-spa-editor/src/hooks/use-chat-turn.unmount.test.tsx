import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../store/ai-store-types";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { useChatTurn } from "./use-chat-turn";

const persistence = createInMemoryPersistence();
const fakeAgent = { sendTurn: vi.fn(), resume: vi.fn() };

vi.mock("../contexts/analytics-context", () => ({
  useAnalytics: () => ({ event: vi.fn(), pageView: vi.fn() }),
}));
vi.mock("../contexts/persistence-context", () => ({
  usePersistence: () => persistence,
}));
vi.mock("./use-chat-action-ops", () => ({
  useChatActionOps: () => ({}),
}));
vi.mock("./chat/build-chat-agent", () => ({
  buildChatAgent: vi.fn(async () => ({ agent: fakeAgent, tools: [] })),
}));

const provider = { id: "p1", type: "anthropic" } as LlmProviderConfig;

const args = {
  profileId: "prof-1",
  conversationId: "conv-a",
  provider,
  modelId: "claude-sonnet-4-6",
  pinModel: false,
  generationProvider: provider,
  generationModelId: "claude-sonnet-4-6",
  today: "2026-06-15",
  messages: [],
};

describe("useChatTurn unmount", () => {
  it("should abort the running turn and keep it in its own conversation", async () => {
    // Arrange
    fakeAgent.sendTurn.mockImplementationOnce(
      (_messages: unknown, options: { signal: AbortSignal }) =>
        new Promise((resolve) => {
          options.signal.addEventListener("abort", () =>
            resolve({ status: "aborted", text: "Half a", messages: [] })
          );
        })
    );
    const { result, unmount } = renderHook(() => useChatTurn(args));
    result.current.send("plan my week");
    await waitFor(() => expect(fakeAgent.sendTurn).toHaveBeenCalled());

    // Act
    unmount();

    // Assert
    await waitFor(async () => {
      const rows = await persistence.chatMessages.listByProfile("prof-1");
      expect(rows.find((r) => r.role === "assistant")).toMatchObject({
        conversationId: "conv-a",
        content: "Half a",
        stopReason: "aborted",
      });
    });
  });
});
