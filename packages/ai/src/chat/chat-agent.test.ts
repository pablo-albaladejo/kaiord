import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import type { ModelMessage } from "ai";
import { createChatAgent } from "./chat-agent";
import type { ChatTool } from "./chat-types";
import { DEFAULT_MAX_STEPS } from "./chat-types";
import type { RawTurn } from "./run-turn";

vi.mock("./run-turn", () => ({ runTurn: vi.fn() }));
const mockRunTurn = vi.mocked((await import("./run-turn")).runTurn);

const model = { modelId: "test-model" } as never;
const assistant: ModelMessage[] = [{ role: "assistant", content: "ok" }];

const readTool: ChatTool = {
  name: "query_workouts",
  description: "query",
  inputSchema: z.object({ days: z.number() }),
  requiresConfirmation: false,
  execute: vi.fn(),
};
const actionTool: ChatTool = {
  name: "sync_coaching",
  description: "sync",
  inputSchema: z.object({ source: z.string() }),
  requiresConfirmation: true,
  execute: vi.fn(),
};

const raw = (over: Partial<RawTurn>): RawTurn => ({
  text: "ok",
  toolCalls: [],
  finishReason: "stop",
  usage: { promptTokens: 1, completionTokens: 1 },
  messages: assistant,
  ...over,
});

describe("createChatAgent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return a complete result with merged conversation on a plain turn", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({ text: "your longest was 90 min" }));
    const agent = createChatAgent({ model, tools: [readTool] });

    // Act
    const result = await agent.sendTurn([
      { role: "user", content: "longest?" },
    ]);

    // Assert
    expect(result.status).toBe("complete");
    expect(result.messages).toEqual([
      { role: "user", content: "longest?" },
      ...assistant,
    ]);
  });

  it("should pause on an action tool call and surface the validated input", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(
      raw({
        finishReason: "tool-calls",
        toolCalls: [
          {
            toolName: "sync_coaching",
            toolCallId: "c1",
            input: { source: "train2go" },
          },
        ],
      })
    );
    const agent = createChatAgent({ model, tools: [readTool, actionTool] });

    // Act
    const result = await agent.sendTurn([{ role: "user", content: "sync" }]);

    // Assert
    expect(result.status).toBe("pending_action");
    if (result.status === "pending_action") {
      expect(result.pendingAction.toolName).toBe("sync_coaching");
    }
  });

  it("should resume after approval by appending the tool result and re-running", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({ text: "synced 4 activities" }));
    const agent = createChatAgent({ model, tools: [readTool, actionTool] });
    const priorMessages: ModelMessage[] = [
      { role: "user", content: "sync" },
      {
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: "c1",
            toolName: "sync_coaching",
            input: { source: "train2go" },
          },
        ],
      },
    ];

    // Act
    const result = await agent.resume(priorMessages, {
      toolCallId: "c1",
      toolName: "sync_coaching",
      status: "approved",
      output: { synced: 4 },
    });

    // Assert
    expect(result.status).toBe("complete");
    const sentMessages = mockRunTurn.mock.calls[0]?.[0].messages;
    expect(sentMessages?.[sentMessages.length - 1]).toMatchObject({
      role: "tool",
    });
  });

  it("should pass the default step cap to runTurn", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({}));
    const agent = createChatAgent({ model, tools: [readTool] });

    // Act
    await agent.sendTurn([{ role: "user", content: "hi" }]);

    // Assert
    expect(mockRunTurn.mock.calls[0]?.[0].maxSteps).toBe(DEFAULT_MAX_STEPS);
  });
});
