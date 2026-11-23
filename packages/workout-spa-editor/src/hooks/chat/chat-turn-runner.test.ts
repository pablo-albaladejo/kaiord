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

type HealthOptions = { signal?: AbortSignal; onWait?: () => void };
const healthRequest = vi.fn<
  (question: unknown, options?: HealthOptions) => Promise<string>
>(async () => "withhold");
vi.mock("../../lib/health-sharing-gate", () => ({
  healthSharingGate: {
    request: (q: unknown, options?: HealthOptions) => healthRequest(q, options),
  },
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
    traceRef: { current: null },
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
            resolve({
              status: "aborted",
              toolNames: [],
              text: "Your last ride",
              messages: [],
            })
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
      toolNames: [],
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
      toolNames: [],
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
      toolNames: [],
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
      toolNames: [],
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
      toolNames: [],
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
      toolNames: [],
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
      toolNames: [],
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
      toolNames: [],
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
        toolNames: [],
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
      toolNames: [],
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
      .mockResolvedValueOnce({
        status: "complete",
        toolNames: [],
        text: "ok",
        messages: [],
      });
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
      toolNames: [],
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
    expect(healthRequest).toHaveBeenCalledWith(
      { flow: "assistant", providerType: "anthropic" },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
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
      toolNames: [],
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

  it("should not replay a stopped reply that read health data once the athlete says don't send", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx } = makeCtx(persistence);
    healthRequest
      .mockResolvedValueOnce("send")
      .mockResolvedValueOnce("withhold");
    fakeAgent.sendTurn
      .mockResolvedValueOnce({
        status: "aborted",
        toolNames: ["query_health"],
        text: "Your HRV was 48 ms",
        messages: [{ role: "assistant", content: "Your HRV was 48 ms" }],
      })
      .mockResolvedValueOnce({
        status: "complete",
        toolNames: [],
        text: "ok",
        messages: [],
      });
    await sendTurn(ctx, [], "How is my HRV?");
    const history = await persistence.chatMessages.listByProfile("p1");

    // Act
    await sendTurn(ctx, history, "Plan tomorrow");

    // Assert
    expect(history.find((r) => r.role === "assistant")?.readHealth).toBe(true);
    expect(fakeAgent.sendTurn.mock.calls[1]?.[0]).toEqual([
      { role: "user", content: "How is my HRV?" },
      { role: "user", content: "Plan tomorrow" },
    ]);
  });

  describe("the Trace of a chat turn", () => {
    const tracesOf = async (
      persistence: ReturnType<typeof createInMemoryPersistence>,
      count = 1
    ) => {
      await vi.waitFor(async () =>
        expect(await persistence.traces.list()).toHaveLength(count)
      );
      return persistence.traces.list();
    };

    it("should leave one Trace per turn naming what went to the Provider", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx } = makeCtx(persistence);
      fakeAgent.sendTurn.mockResolvedValueOnce({
        status: "complete",
        toolNames: [],
        text: "hi",
        messages: [],
      });

      // Act
      await sendTurn(ctx, [], "hello");
      const [trace] = await tracesOf(persistence);

      // Assert
      expect(trace).toMatchObject({
        feature: "chat",
        outcome: "ok",
        sent: [{ to: "anthropic", kinds: ["messages"] }],
      });
      expect(ctx.traceRef.current).toBeNull();
    });

    it("should set apart the health data earlier replies replayed to the Provider may quote", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx } = makeCtx(persistence);
      healthRequest.mockResolvedValueOnce("send");
      fakeAgent.sendTurn.mockResolvedValueOnce({
        status: "complete",
        toolNames: [],
        text: "ok",
        messages: [],
      });
      const at = "2026-06-13T10:00:00.000Z";
      const base = { profileId: "p1", conversationId: "c1", createdAt: at };
      const history = [
        { ...base, id: "1", role: "user" as const, content: "Sleep?" },
        { ...base, id: "2", role: "assistant" as const, content: "6 h." },
      ];

      // Act
      await sendTurn(ctx, history, "Plan tomorrow");
      const [trace] = await tracesOf(persistence);

      // Assert
      expect(trace?.sent).toEqual([
        {
          to: "anthropic",
          kinds: ["messages"],
          declared: [
            "sleep",
            "restingHeartRate",
            "weight",
            "hrv",
            "dailyActivity",
            "bodyComposition",
            "stress",
            "meals",
            "energyBalance",
          ],
        },
      ]);
    });

    it("should cancel the waiting question on Stop, send nothing, and leave a stopped Trace", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx, states, errors } = makeCtx(persistence);
      healthRequest.mockImplementationOnce(
        (_q, options) =>
          new Promise((_resolve, reject) => {
            options?.onWait?.();
            options?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          })
      );
      const running = sendTurn(ctx, [], "How did I sleep?");
      await vi.waitFor(() => expect(healthRequest).toHaveBeenCalled());
      const waiting = await tracesOf(persistence);

      // Act
      stopTurn(ctx);
      await running;
      const [trace] = await persistence.traces.list();

      // Assert
      expect(waiting[0]?.outcome).toBe("stopped");
      expect(fakeAgent.sendTurn).not.toHaveBeenCalled();
      expect(vi.mocked(buildChatAgent)).not.toHaveBeenCalled();
      expect(trace).toMatchObject({ outcome: "stopped", sent: [] });
      expect(states.at(-1)).toBe("idle");
      expect(errors.filter(Boolean)).toEqual([]);
    });

    it("should keep the Trace open while the athlete decides, and record the confirmed Tool", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx } = makeCtx(persistence);
      const pending: PendingAction = {
        toolName: "sync_coaching",
        toolCallId: "c1",
        input: {},
      };
      fakeAgent.sendTurn.mockResolvedValueOnce({
        status: "pending_action",
        toolNames: [],
        pendingAction: pending,
        messages: [],
      });
      fakeAgent.resume.mockResolvedValueOnce({
        status: "complete",
        toolNames: [],
        text: "done",
        messages: [],
      });

      // Act
      await sendTurn(ctx, [], "sync my plan");
      ctx.toolsRef.current = [
        { name: "sync_coaching", execute: vi.fn() } as unknown as ChatTool,
      ];
      const openWhilePending = await persistence.traces.list();
      await approveAction(ctx, pending);
      const [trace] = await tracesOf(persistence);

      // Assert
      expect(openWhilePending).toHaveLength(0);
      expect(trace?.tools).toEqual([
        { name: "sync_coaching", confirmation: "athlete", result: "ok" },
      ]);
    });

    it("should stop an approved action while it waits, resume nothing and leave a stopped Trace", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx, states } = makeCtx(persistence);
      const pending: PendingAction = {
        toolName: "create_workout",
        toolCallId: "c1",
        input: {},
      };
      fakeAgent.sendTurn.mockResolvedValueOnce({
        status: "pending_action",
        toolNames: [],
        pendingAction: pending,
        messages: [],
      });
      let heldSignal: AbortSignal | undefined;
      const execute = vi.fn(
        () =>
          new Promise((_resolve, reject) => {
            heldSignal = ctx.abortRef.current?.signal;
            heldSignal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          })
      );
      await sendTurn(ctx, [], "plan tomorrow");
      ctx.toolsRef.current = [
        { name: "create_workout", execute } as unknown as ChatTool,
      ];

      // Act
      const approving = approveAction(ctx, pending);
      await vi.waitFor(() => expect(execute).toHaveBeenCalled());
      stopTurn(ctx);
      await approving;
      const [trace] = await tracesOf(persistence);
      const rows = await persistence.chatMessages.listByProfile("p1");

      // Assert
      expect(heldSignal?.aborted).toBe(true);
      expect(fakeAgent.resume).not.toHaveBeenCalled();
      expect(trace?.outcome).toBe("stopped");
      expect(rows.filter((r) => r.role === "tool")).toEqual([]);
      expect(states.at(-1)).toBe("idle");
    });

    it("should record a Tool the athlete refused", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx } = makeCtx(persistence);
      const pending: PendingAction = {
        toolName: "create_workout",
        toolCallId: "c1",
        input: {},
      };
      fakeAgent.sendTurn.mockResolvedValueOnce({
        status: "pending_action",
        toolNames: [],
        pendingAction: pending,
        messages: [],
      });
      fakeAgent.resume.mockResolvedValueOnce({
        status: "complete",
        toolNames: [],
        text: "ok",
        messages: [],
      });

      // Act
      await sendTurn(ctx, [], "make me a ride");
      await denyAction(ctx, pending);
      const [trace] = await tracesOf(persistence);

      // Assert
      expect(trace?.tools).toEqual([
        { name: "create_workout", confirmation: "athlete", result: "refused" },
      ]);
    });

    it("should record a failed turn as failed", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx } = makeCtx(persistence);
      fakeAgent.sendTurn.mockRejectedValueOnce(new Error("provider down"));

      // Act
      await sendTurn(ctx, [], "hello");
      const [trace] = await tracesOf(persistence);

      // Assert
      expect(trace?.outcome).toBe("failed");
    });
  });
});
