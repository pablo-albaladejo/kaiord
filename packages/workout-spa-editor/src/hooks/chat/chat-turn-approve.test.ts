import type { ChatTool, PendingAction } from "@kaiord/ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { sendTurn } from "./chat-turn-runner";
import type { ChatTurnCtx, ChatTurnState } from "./chat-turn-types";

const fakeAgent = { sendTurn: vi.fn(), resume: vi.fn() };
const push = vi.fn();
const create = vi.fn();

const actionTool = (name: string, execute: ChatTool["execute"]): ChatTool => ({
  name,
  description: name,
  inputSchema: z.object({}).passthrough(),
  requiresConfirmation: true,
  execute,
});

vi.mock("./build-chat-agent", () => ({
  buildChatAgent: vi.fn(async () => ({
    agent: fakeAgent,
    tools: [
      actionTool("push_to_garmin", push),
      actionTool("create_workout", create),
    ],
  })),
}));

const pendingFor = (toolName: string): PendingAction => ({
  toolName,
  toolCallId: `call-${toolName}`,
  input: { workoutId: "w1" },
});

const makeCtx = (persistence: ReturnType<typeof createInMemoryPersistence>) => {
  const states: ChatTurnState[] = [];
  const pendings: Array<PendingAction | null> = [];
  const ctx: ChatTurnCtx = {
    persistence,
    profileId: "p1",
    conversationId: "c1",
    provider: { id: "prov-1", type: "anthropic" } as LlmProviderConfig,
    modelId: "claude-sonnet-4-5",
    pinModel: false,
    today: "2026-06-13",
    ops: {} as never,
    agentRef: { current: null },
    toolsRef: { current: [] },
    messagesRef: { current: [] },
    abortRef: { current: null },
    disposedRef: { current: false },
    set: {
      state: (s) => states.push(s),
      streamingText: () => undefined,
      pendingAction: (p) => pendings.push(p),
      error: () => undefined,
    },
  };
  return { ctx, states, pendings };
};

describe("auto-approved chat actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should push to Garmin without a confirmation card and resume as approved", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states, pendings } = makeCtx(persistence);
    const output = { workoutId: "w1", garminPushId: "123" };
    push.mockResolvedValueOnce(output);
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "pending_action",
      pendingAction: pendingFor("push_to_garmin"),
      messages: [],
    });
    fakeAgent.resume.mockResolvedValueOnce({
      status: "complete",
      text: "Sent to Garmin.",
      messages: [],
    });

    // Act
    await sendTurn(ctx, [], "send it to garmin");

    // Assert
    expect(push).toHaveBeenCalledWith({ workoutId: "w1" });
    expect(fakeAgent.resume).toHaveBeenCalledWith(
      [],
      {
        toolCallId: "call-push_to_garmin",
        toolName: "push_to_garmin",
        status: "approved",
        output,
      },
      expect.anything()
    );
    expect(pendings.filter(Boolean)).toEqual([]);
    expect(states).not.toContain("awaiting_confirmation");
    const stored = await persistence.chatMessages.listByProfile("p1");
    expect(stored.map((m) => m.role)).toEqual(["user", "tool", "assistant"]);
    expect(stored[1]).toMatchObject({
      toolName: "push_to_garmin",
      toolResult: output,
    });
  });

  it("should still ask before any other action", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { ctx, states, pendings } = makeCtx(persistence);
    const pending = pendingFor("create_workout");
    fakeAgent.sendTurn.mockResolvedValueOnce({
      status: "pending_action",
      pendingAction: pending,
      messages: [],
    });

    // Act
    await sendTurn(ctx, [], "make me a workout");

    // Assert
    expect(create).not.toHaveBeenCalled();
    expect(fakeAgent.resume).not.toHaveBeenCalled();
    expect(pendings.at(-1)).toEqual(pending);
    expect(states.at(-1)).toBe("awaiting_confirmation");
  });
});
