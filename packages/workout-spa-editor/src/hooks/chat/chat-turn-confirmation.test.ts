import type { ChatTool, PendingAction } from "@kaiord/ai";
import { CHAT_ACTION_TOOL_NAMES } from "@kaiord/ai/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { sendTurn } from "./chat-turn-runner";
import type { ChatTurnCtx, ChatTurnState } from "./chat-turn-types";

const fakeAgent = { sendTurn: vi.fn(), resume: vi.fn() };
const execute = vi.fn();

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
    tools: CHAT_ACTION_TOOL_NAMES.map((name) => actionTool(name, execute)),
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

describe("chat actions wait for the athlete", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(CHAT_ACTION_TOOL_NAMES.map((name) => [name]))(
    "should park %s at a confirmation card without running it",
    async (toolName) => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const { ctx, states, pendings } = makeCtx(persistence);
      const pending = pendingFor(toolName);
      fakeAgent.sendTurn.mockResolvedValueOnce({
        status: "pending_action",
        pendingAction: pending,
        messages: [],
      });

      // Act
      await sendTurn(ctx, [], "do it");

      // Assert
      expect(execute).not.toHaveBeenCalled();
      expect(fakeAgent.resume).not.toHaveBeenCalled();
      expect(pendings.at(-1)).toEqual(pending);
      expect(states.at(-1)).toBe("awaiting_confirmation");
    }
  );
});
