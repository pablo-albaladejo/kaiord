import { describe, it, expect } from "vitest";
import type { ModelMessage } from "ai";
import { classifyTurn } from "./classify-turn";
import type { RawTurn } from "./run-turn";

const history: ModelMessage[] = [{ role: "user", content: "hi" }];
const response: ModelMessage[] = [{ role: "assistant", content: "hello" }];

const rawTurn = (over: Partial<RawTurn>): RawTurn => ({
  text: "hello",
  toolCalls: [],
  finishReason: "stop",
  usage: { promptTokens: 10, completionTokens: 5 },
  messages: response,
  ...over,
});

describe("classifyTurn", () => {
  it("should return complete with text and merged history on a plain stop", () => {
    // Arrange
    const raw = rawTurn({ finishReason: "stop" });

    // Act
    const result = classifyTurn(history, raw, new Set());

    // Assert
    expect(result.status).toBe("complete");
    expect(result.messages).toEqual([...history, ...response]);
  });

  it("should return pending_action when an action tool was called", () => {
    // Arrange
    const raw = rawTurn({
      finishReason: "tool-calls",
      toolCalls: [
        {
          toolName: "sync_coaching",
          toolCallId: "c1",
          input: { source: "train2go" },
        },
      ],
    });

    // Act
    const result = classifyTurn(history, raw, new Set(["sync_coaching"]));

    // Assert
    expect(result.status).toBe("pending_action");
    if (result.status === "pending_action") {
      expect(result.pendingAction).toMatchObject({
        toolName: "sync_coaching",
        toolCallId: "c1",
      });
    }
  });

  it("should return step_limit when the loop halts still wanting tools", () => {
    // Arrange
    const raw = rawTurn({ finishReason: "tool-calls", text: "" });

    // Act
    const result = classifyTurn(history, raw, new Set(["sync_coaching"]));

    // Assert
    expect(result.status).toBe("step_limit");
  });

  it("should treat a read-tool call without action names as not pending", () => {
    // Arrange
    const raw = rawTurn({
      finishReason: "stop",
      toolCalls: [{ toolName: "query_workouts", toolCallId: "r1", input: {} }],
    });

    // Act
    const result = classifyTurn(history, raw, new Set(["sync_coaching"]));

    // Assert
    expect(result.status).toBe("complete");
  });
});
