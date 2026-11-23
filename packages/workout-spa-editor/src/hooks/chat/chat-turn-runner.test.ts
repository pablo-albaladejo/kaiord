import type { ChatTool, PendingAction } from "@kaiord/ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { buildChatAgent } from "./build-chat-agent";
import { stopTurn } from "./chat-turn-context";
import { approveAction, denyAction } from "./chat-turn-resume";
import { retryTurn, sendTurn } from "./chat-turn-runner";
import type { ChatTurnCtx, ChatTurnState } from "./chat-turn-types";

const fakeAgent = { sendTurn: vi.fn(), resume: vi.fn() };

vi.mock("./build-chat-agent", () => ({
  buildChatAgent: vi.fn(async () => ({ agent: fakeAgent, tools: [] })),
}));

const healthRequest = vi.fn<(question: unknown) => Promise<string>>(
  async () => "withhold"
);
vi.mock("../../lib/health-sharing-gate", () => ({
  healthSharingGate: { request: (q: unknown) => healthRequest(q) },
}));

const provider = { id: "prov-1", type: "anthropic" } as LlmProviderConfig;

const makeCtx = (
  persistence: ReturnType<typeof createInMemoryPersistence>,
  pinModel = false
) => {
  const states: ChatTurnState[] = [];
  const pendings: Array<PendingAction | null> = [];
  const errors: Array<string | null> = [];
  const ctx: ChatTurnCtx = {
    persistence,
    profileId: "p1",
    conversationId: "c1",
    provider,
    modelId: "claude-sonnet-4-5",
    pinModel,
    today: "2026-06-13",
    ops: {} as never,
    agentRef: { current: fakeAgent as never },
    toolsRef: { current: [] },
    messagesRef: { current: [] },
    abortRef: { current: null },
    disposedRef: { current: false },
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

  it("should stop a streaming turn and persist its partial reply marked stopped", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states, pendings } = makeCtx(persistence);
    fakeAgent.sendTurn.mockImplementationOnce(
      (_messages: unknown, options: { signal: AbortSignal }) =>
        new Promise((resolve) => {
          options.signal.addEventListener("abort", () =>
            resolve({ status: "aborted", text: "Your last ride", messages: [] })
          );
        })
    );

    // Act
    const running = sendTurn(ctx, [], "last ride?");
    await vi.waitFor(() => expect(fakeAgent.sendTurn).toHaveBeenCalled());
    stopTurn(ctx);
    await running;

    // Assert
    const stored = await persistence.chatMessages.listByProfile("p1");
    expect(stored.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(stored[1]).toMatchObject({
      content: "Your last ride",
      stopReason: "aborted",
    });
    expect(pendings.at(-1)).toBeNull();
    expect(states.at(-1)).toBe("idle");
    expect(ctx.abortRef.current).toBeNull();
  });

  it("should persist a timed-out turn with its timeout stop reason", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states } = makeCtx(persistence);
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "timeout",
      text: "",
      messages: [],
    });

    // Act
    await sendTurn(ctx, [], "slow?");

    // Assert
    const stored = await persistence.chatMessages.listByProfile("p1");
    expect(stored[1]).toMatchObject({ content: "", stopReason: "timeout" });
    expect(states.at(-1)).toBe("idle");
  });

  it("should do nothing when stop is called with no turn in flight", () => {
    // Arrange
    const { ctx, states } = makeCtx(createInMemoryPersistence());

    // Act
    stopTurn(ctx);

    // Assert
    expect(states).toEqual([]);
  });

  it("should not pin the model on a draft that follows the main model", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence, false);
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "complete",
      text: "ok",
      messages: [],
      usage: { promptTokens: 1, completionTokens: 1 },
    });

    // Act
    await sendTurn(ctx, [], "hello");

    // Assert
    const row = await persistence.chatConversations.get("p1", "c1");
    expect(row?.providerId).toBeUndefined();
    expect(row?.modelId).toBeUndefined();
  });

  it("should pin the draft's own model on its first message", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence, true);
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "complete",
      text: "ok",
      messages: [],
      usage: { promptTokens: 1, completionTokens: 1 },
    });

    // Act
    await sendTurn(ctx, [], "hello");

    // Assert
    const row = await persistence.chatConversations.get("p1", "c1");
    expect(row?.providerId).toBe("prov-1");
    expect(row?.modelId).toBe("claude-sonnet-4-5");
  });

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
      expect.objectContaining({ status: "approved", output: { synced: 3 } }),
      { signal: expect.any(AbortSignal) }
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
      expect.objectContaining({ status: "declined" }),
      { signal: expect.any(AbortSignal) }
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
    expect(errors.at(-1)).toBe("auth");
  });

  it("should not duplicate the user message when a failed turn is retried twice", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states } = makeCtx(persistence);
    const failure = new Error("400 invalid_request_error");
    const SEND_PLUS_TWO_RETRIES = 3;
    fakeAgent.sendTurn
      .mockRejectedValueOnce(failure)
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({
        status: "complete",
        text: "hola!",
        messages: [],
      });
    const history = () => persistence.chatMessages.listByProfile("p1");
    await sendTurn(ctx, [], "hola");

    // Act
    await retryTurn(ctx, await history(), "hola");
    await retryTurn(ctx, await history(), "hola");

    // Assert
    const userTurns = (await history()).filter((m) => m.role === "user");
    expect(userTurns.map((m) => m.content)).toEqual(["hola"]);
    for (const [sent] of fakeAgent.sendTurn.mock.calls)
      expect(sent).toEqual([{ role: "user", content: "hola" }]);
    expect(fakeAgent.sendTurn).toHaveBeenCalledTimes(SEND_PLUS_TWO_RETRIES);
    expect(states.at(-1)).toBe("idle");
  });

  it("should send the text when the failure happened before the user message was persisted", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "complete",
      text: "hi",
      messages: [],
    });

    // Act
    await retryTurn(ctx, [], "hola");

    // Assert
    expect(fakeAgent.sendTurn).toHaveBeenCalledWith(
      [{ role: "user", content: "hola" }],
      { signal: expect.any(AbortSignal) }
    );
    const stored = await persistence.chatMessages.listByProfile("p1");
    expect(stored.filter((m) => m.role === "user")).toHaveLength(1);
  });

  it("should send the text when the persisted last user message differs from it", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    fakeAgent.sendTurn
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ status: "complete", text: "ok", messages: [] });
    await sendTurn(ctx, [], "first");
    const history = await persistence.chatMessages.listByProfile("p1");

    // Act
    await retryTurn(ctx, history, "second");

    // Assert
    expect(fakeAgent.sendTurn).toHaveBeenLastCalledWith(
      [
        { role: "user", content: "first" },
        { role: "user", content: "second" },
      ],
      { signal: expect.any(AbortSignal) }
    );
  });

  it("should ask about health data before the turn and send nothing until answered", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    let answer: (share: string) => void = () => undefined;
    healthRequest.mockImplementationOnce(
      () => new Promise((resolve) => (answer = resolve))
    );
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "complete",
      text: "ok",
      messages: [],
    });

    // Act
    const running = sendTurn(ctx, [], "How did I sleep?");
    await vi.waitFor(() => expect(healthRequest).toHaveBeenCalled());
    const sentWhileAsking = fakeAgent.sendTurn.mock.calls.length;
    answer("send");
    await running;

    // Assert
    expect(healthRequest).toHaveBeenCalledWith({
      flow: "assistant",
      providerType: "anthropic",
    });
    expect(sentWhileAsking).toBe(0);
    expect(vi.mocked(buildChatAgent)).toHaveBeenCalledWith(
      expect.objectContaining({ healthShared: true })
    );
  });

  it("should send the turn without health tools or the answers that used them when the athlete does not share", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    healthRequest.mockResolvedValueOnce("withhold");
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "complete",
      text: "ok",
      messages: [],
    });
    const at = "2026-06-13T10:00:00.000Z";
    const base = { profileId: "p1", conversationId: "c1", createdAt: at };
    const history = [
      { ...base, id: "1", role: "user" as const, content: "Sleep?" },
      {
        ...base,
        id: "2",
        role: "assistant" as const,
        content: "You slept 6 h.",
        readHealth: true,
      },
    ];

    // Act
    await sendTurn(ctx, history, "Plan tomorrow");

    // Assert
    expect(vi.mocked(buildChatAgent)).toHaveBeenCalledWith(
      expect.objectContaining({ healthShared: false })
    );
    expect(fakeAgent.sendTurn.mock.calls[0]?.[0]).toEqual([
      { role: "user", content: "Sleep?" },
      { role: "user", content: "Plan tomorrow" },
    ]);
  });
});
