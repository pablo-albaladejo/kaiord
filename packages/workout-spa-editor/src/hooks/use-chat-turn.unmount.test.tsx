import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../store/ai-store-types";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { runConfirmedTool } from "./chat/run-confirmed-tool";
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
vi.mock("./chat/run-confirmed-tool", () => ({ runConfirmedTool: vi.fn() }));
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

  it("should abort a resume that starts after the conversation was left and save it there", async () => {
    // Arrange
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "pending_action",
      pendingAction: {
        toolCallId: "call-1",
        toolName: "create_workout",
        input: { date: "2026-06-16", description: "Easy run" },
      },
      messages: [],
    });
    let finishTool: (r: { output: unknown; ok: boolean }) => void = () =>
      undefined;
    vi.mocked(runConfirmedTool).mockImplementationOnce(
      () => new Promise((resolve) => (finishTool = resolve))
    );
    let resumeSignal: AbortSignal | undefined;
    fakeAgent.resume.mockImplementationOnce(
      async (_m: unknown, _r: unknown, options: { signal: AbortSignal }) => {
        resumeSignal = options.signal;
        return { status: "aborted", text: "", messages: [] };
      }
    );
    const { result, unmount } = renderHook(() =>
      useChatTurn({ ...args, conversationId: "conv-b" })
    );
    result.current.send("add an easy run tomorrow");
    await waitFor(() => expect(result.current.pendingAction).not.toBeNull());
    result.current.approve();
    await waitFor(() => expect(runConfirmedTool).toHaveBeenCalled());

    // Act
    unmount();
    finishTool({ output: { id: "w1" }, ok: true });

    // Assert
    await waitFor(() => expect(fakeAgent.resume).toHaveBeenCalled());
    expect(resumeSignal?.aborted).toBe(true);
    await waitFor(async () => {
      const rows = (
        await persistence.chatMessages.listByProfile("prof-1")
      ).filter((r) => r.conversationId === "conv-b");
      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: "tool", toolName: "create_workout" }),
          expect.objectContaining({ role: "assistant", stopReason: "aborted" }),
        ])
      );
    });
  });
});
