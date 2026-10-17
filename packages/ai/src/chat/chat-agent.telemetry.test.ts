import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";

import { createRingBufferTelemetrySink } from "../observability/ring-buffer-sink";
import { createChatAgent } from "./chat-agent";
import { DEFAULT_TURN_IDLE_TIMEOUT_MS } from "./chat-types";
import type { ChatTool } from "./chat-types";
import type { RawTurn } from "./run-turn";

vi.mock("./run-turn", () => ({ runTurn: vi.fn() }));
vi.mock("./classify-turn", async (importOriginal) => ({
  classifyTurn: vi.fn(
    (await importOriginal<typeof import("./classify-turn")>()).classifyTurn
  ),
}));
const mockRunTurn = vi.mocked((await import("./run-turn")).runTurn);
const mockClassify = vi.mocked((await import("./classify-turn")).classifyTurn);
const { attachTurnMetrics } = await import("./turn-stats");

const model = { provider: "anthropic.messages", modelId: "claude-x" } as never;
const USER_TEXT = "my resting heart rate is secret-4242";
const MODEL_TEXT = "your sleep averaged secret-7.5h";
const TOOL_INPUT_MARK = "secret-input-99";

const actionTool: ChatTool = {
  name: "log_intake",
  description: "log",
  inputSchema: z.object({ note: z.string() }),
  requiresConfirmation: true,
  execute: vi.fn(),
};

const raw = (over: Partial<RawTurn>): RawTurn => ({
  text: MODEL_TEXT,
  toolCalls: [],
  finishReason: "stop",
  usage: { promptTokens: 120, completionTokens: 30 },
  messages: [{ role: "assistant", content: MODEL_TEXT }],
  steps: 2,
  toolNames: ["query_health"],
  ...over,
});

const EVENT_KEYS = [
  "inputTokens",
  "latencyMs",
  "modelId",
  "outputTokens",
  "promptVersion",
  "provider",
  "status",
  "steps",
  "toolNames",
  "traceId",
  "type",
];

describe("createChatAgent telemetry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should emit one chat_turn_finished event with ids and metrics only", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({}));
    const sink = createRingBufferTelemetrySink();
    const agent = createChatAgent({
      model,
      tools: [],
      telemetry: sink,
      promptVersion: "1.0.0",
    });

    // Act
    await agent.sendTurn([{ role: "user", content: USER_TEXT }]);

    // Assert
    const [event] = sink.events();
    expect(sink.events()).toHaveLength(1);
    expect(Object.keys(event).sort()).toEqual(EVENT_KEYS);
    expect(event).toMatchObject({
      type: "chat_turn_finished",
      promptVersion: "1.0.0",
      provider: "anthropic.messages",
      modelId: "claude-x",
      steps: 2,
      toolNames: ["query_health"],
      status: "complete",
      inputTokens: 120,
      outputTokens: 30,
    });
  });

  it("should never carry user text, model text, or tool input in the event", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(
      raw({
        finishReason: "tool-calls",
        toolCalls: [
          {
            toolName: "log_intake",
            toolCallId: "c1",
            input: { note: TOOL_INPUT_MARK },
          },
        ],
        toolNames: ["log_intake"],
      })
    );
    const sink = createRingBufferTelemetrySink();
    const agent = createChatAgent({
      model,
      tools: [actionTool],
      telemetry: sink,
    });

    // Act
    await agent.sendTurn([{ role: "user", content: USER_TEXT }]);

    // Assert
    const serialized = JSON.stringify(sink.events());
    expect(sink.events()[0]).toMatchObject({ status: "pending_action" });
    expect(serialized).not.toContain("secret-");
  });

  it("should report a stopped turn with its stop cause as status", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({ stopped: "aborted" }));
    const sink = createRingBufferTelemetrySink();
    const agent = createChatAgent({ model, tools: [], telemetry: sink });

    // Act
    const result = await agent.sendTurn([{ role: "user", content: USER_TEXT }]);

    // Assert
    expect(result.status).toBe("aborted");
    expect(sink.events()[0]).toMatchObject({ status: "aborted" });
  });

  it("should report the finished steps' metrics on an error event", async () => {
    // Arrange
    const failure = new Error("overloaded");
    attachTurnMetrics(failure, {
      steps: 1,
      toolNames: ["query_health"],
      usage: { promptTokens: 40, completionTokens: 9 },
    });
    mockRunTurn.mockRejectedValueOnce(failure);
    const sink = createRingBufferTelemetrySink();
    const agent = createChatAgent({ model, tools: [], telemetry: sink });

    // Act
    const run = agent.sendTurn([{ role: "user", content: USER_TEXT }]);

    // Assert
    await expect(run).rejects.toBe(failure);
    expect(sink.events()).toEqual([
      expect.objectContaining({
        status: "error",
        steps: 1,
        toolNames: ["query_health"],
        inputTokens: 40,
        outputTokens: 9,
      }),
    ]);
  });

  it("should emit exactly one error event when classifying the turn throws", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({}));
    mockClassify.mockImplementationOnce(() => {
      throw new Error("classify failed");
    });
    const sink = createRingBufferTelemetrySink();
    const agent = createChatAgent({ model, tools: [], telemetry: sink });

    // Act
    const run = agent.sendTurn([{ role: "user", content: "x" }]);

    // Assert
    await expect(run).rejects.toThrow("classify failed");
    expect(sink.events()).toHaveLength(1);
    expect(sink.events()[0]).toMatchObject({ status: "error" });
  });

  it("should emit an error event with zero metrics and rethrow when the turn fails", async () => {
    // Arrange
    mockRunTurn.mockRejectedValueOnce(new Error(`boom ${USER_TEXT}`));
    const sink = createRingBufferTelemetrySink();
    const agent = createChatAgent({ model, tools: [], telemetry: sink });

    // Act
    const run = agent.sendTurn([{ role: "user", content: USER_TEXT }]);

    // Assert
    await expect(run).rejects.toThrow("boom");
    expect(sink.events()[0]).toMatchObject({
      status: "error",
      steps: 0,
      inputTokens: 0,
      outputTokens: 0,
      promptVersion: "unknown",
    });
    expect(JSON.stringify(sink.events())).not.toContain("secret-");
  });

  it("should pass the caller signal and the default idle watchdog to runTurn", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({}));
    const controller = new AbortController();
    const agent = createChatAgent({ model, tools: [] });

    // Act
    await agent.sendTurn([{ role: "user", content: "x" }], {
      signal: controller.signal,
    });

    // Assert
    expect(mockRunTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: controller.signal,
        idleTimeoutMs: DEFAULT_TURN_IDLE_TIMEOUT_MS,
      })
    );
  });

  it("should not fail the turn when the telemetry sink throws", async () => {
    // Arrange
    mockRunTurn.mockResolvedValueOnce(raw({}));
    const telemetry = {
      emit: () => {
        throw new Error("sink down");
      },
    };
    const agent = createChatAgent({ model, tools: [], telemetry });

    // Act
    const result = await agent.sendTurn([{ role: "user", content: "x" }]);

    // Assert
    expect(result.status).toBe("complete");
  });
});
