import type { ChatTool, PendingAction } from "@kaiord/ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { approveAction, denyAction } from "./chat-turn-resume";
import { sendTurn } from "./chat-turn-runner";
import type { ChatTurnCtx, ChatTurnState } from "./chat-turn-types";

const fakeAgent = { sendTurn: vi.fn(), resume: vi.fn() };

vi.mock("./build-chat-agent", () => ({
  buildChatAgent: vi.fn(async () => ({ agent: fakeAgent, tools: [] })),
}));

const provider = { id: "prov-1", type: "anthropic" } as LlmProviderConfig;

const makeCtx = (persistence: ReturnType<typeof createInMemoryPersistence>) => {
  const states: ChatTurnState[] = [];
  const pendings: Array<PendingAction | null> = [];
  const errors: Array<string | null> = [];
  const ctx: ChatTurnCtx = {
    persistence,
    profileId: "p1",
    conversationId: "c1",
    provider,
    modelId: "claude-sonnet-4-5",
    today: "2026-06-13",
    ops: {} as never,
    agentRef: { current: fakeAgent as never },
    toolsRef: { current: [] },
    messagesRef: { current: [] },
    set: {
      state: (s) => states.push(s),
      streamingText: () => undefined,
      pendingAction: (p) => pendings.push(p),
      error: (e) => errors.push(e),
    },
  };
  return { ctx, states, pendings, errors };
};

describe("chat-turn-runner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should append user and assistant messages on a completed send", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states } = makeCtx(persistence);
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "complete",
      text: "your longest ride was 2h",
      messages: [],
      usage: { promptTokens: 10, completionTokens: 5 },
    });

    // Act
    await sendTurn(ctx, [], "longest ride?");

    // Assert
    const stored = await persistence.chatMessages.listByProfile("p1");
    expect(stored.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(stored.every((m) => m.conversationId === "c1")).toBe(true);
    const conversation = await persistence.chatConversations.get("p1", "c1");
    expect(conversation?.title).toBe("longest ride?");
    expect(states.at(-1)).toBe("idle");
  });

  it("should park the turn awaiting confirmation on a pending action", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states, pendings } = makeCtx(persistence);
    const pending: PendingAction = {
      toolName: "sync_coaching",
      toolCallId: "c1",
      input: {},
    };
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "pending_action",
      pendingAction: pending,
      messages: [],
    });

    // Act
    await sendTurn(ctx, [], "sync");

    // Assert
    expect(states.at(-1)).toBe("awaiting_confirmation");
    expect(pendings.at(-1)).toEqual(pending);
  });

  it("should run the confirmed tool and resume on approve", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    const execute = vi.fn().mockResolvedValue({ synced: 3 });
    ctx.toolsRef.current = [
      { name: "sync_coaching", execute } as unknown as ChatTool,
    ];
    fakeAgent.resume.mockResolvedValueOnce({
      status: "complete",
      text: "synced 3",
      messages: [],
    });
    const pending: PendingAction = {
      toolName: "sync_coaching",
      toolCallId: "c1",
      input: { source: "train2go" },
    };

    // Act
    await approveAction(ctx, pending);

    // Assert
    expect(execute).toHaveBeenCalledWith({ source: "train2go" });
    expect(fakeAgent.resume).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ status: "approved", output: { synced: 3 } })
    );
  });

  it("should persist the create_workout result on the tool-event message", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    const execute = vi
      .fn()
      .mockResolvedValue({ workoutId: "w1", date: "2026-06-20" });
    ctx.toolsRef.current = [
      { name: "create_workout", execute } as unknown as ChatTool,
    ];
    fakeAgent.resume.mockResolvedValueOnce({
      status: "complete",
      text: "created your workout",
      messages: [],
    });
    const pending: PendingAction = {
      toolName: "create_workout",
      toolCallId: "c3",
      input: { description: "easy ride", date: "2026-06-20" },
    };

    // Act
    await approveAction(ctx, pending);

    // Assert
    const stored = await persistence.chatMessages.listByProfile("p1");
    const toolMessage = stored.find((m) => m.toolName === "create_workout");
    expect(toolMessage?.toolResult).toEqual({
      workoutId: "w1",
      date: "2026-06-20",
    });
  });

  it("should resume with a declined result on deny without running a tool", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    fakeAgent.resume.mockResolvedValueOnce({
      status: "complete",
      text: "ok, skipped",
      messages: [],
    });
    const pending: PendingAction = {
      toolName: "create_workout",
      toolCallId: "c2",
      input: {},
    };

    // Act
    await denyAction(ctx, pending);

    // Assert
    expect(fakeAgent.resume).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ status: "declined" })
    );
  });

  it("should surface a fixed error category when the turn throws", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states, errors } = makeCtx(persistence);
    fakeAgent.sendTurn.mockRejectedValueOnce(new Error("401 unauthorized"));

    // Act
    await sendTurn(ctx, [], "hi");

    // Assert
    expect(states.at(-1)).toBe("error");
    expect(errors.at(-1)).toContain("Authentication failed");
  });
});
