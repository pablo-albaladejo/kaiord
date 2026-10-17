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

  it("should pick the first action call when a turn holds several", () => {
    // Arrange
    const raw = rawTurn({
      finishReason: "tool-calls",
      toolCalls: [
        { toolName: "set_data_route", toolCallId: "early", input: {} },
        { toolName: "query_workouts", toolCallId: "read", input: {} },
        { toolName: "set_data_route", toolCallId: "late", input: {} },
      ],
    });

    // Act
    const result = classifyTurn(history, raw, new Set(["set_data_route"]));

    // Assert
    expect(result.status).toBe("pending_action");
    if (result.status === "pending_action") {
      expect(result.pendingAction.toolCallId).toBe("early");
    }
  });

  it("should answer the other action calls of the step so none is left without a result", () => {
    // Arrange
    const raw = rawTurn({
      finishReason: "tool-calls",
      toolCalls: [
        { toolName: "set_data_route", toolCallId: "early", input: {} },
        { toolName: "query_workouts", toolCallId: "read", input: {} },
        { toolName: "push_to_garmin", toolCallId: "late", input: {} },
      ],
    });
    const actions = new Set(["set_data_route", "push_to_garmin"]);

    // Act
    const result = classifyTurn(history, raw, actions);

    // Assert
    expect(result.status).toBe("pending_action");
    expect(result.messages.slice(0, -1)).toEqual([...history, ...response]);
    expect(result.messages.at(-1)).toEqual({
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "late",
          toolName: "push_to_garmin",
          output: {
            type: "json",
            value: expect.objectContaining({ error: "one_action_at_a_time" }),
          },
        },
      ],
    });
    if (result.status !== "pending_action") throw new Error(result.status);
    expect(result.pendingAction.deferredCount).toBe(1);
  });

  it("should tell the model a user's no to the pending action does not cover the deferred one", () => {
    // Arrange
    const raw = rawTurn({
      finishReason: "tool-calls",
      toolCalls: [
        { toolName: "set_data_route", toolCallId: "early", input: { a: 1 } },
        { toolName: "set_data_route", toolCallId: "late", input: { a: 2 } },
      ],
    });

    // Act
    const result = classifyTurn(history, raw, new Set(["set_data_route"]));

    // Assert
    expect(JSON.stringify(result.messages.at(-1))).toContain(
      "applies to that action only"
    );
  });

  it("should answer a copy of the pending call as a duplicate without counting it as deferred", () => {
    // Arrange
    const input = { dataType: "sleep" };
    const raw = rawTurn({
      finishReason: "tool-calls",
      toolCalls: [
        { toolName: "set_data_route", toolCallId: "pending", input },
        {
          toolName: "set_data_route",
          toolCallId: "copy",
          input: { ...input },
        },
      ],
    });

    // Act
    const result = classifyTurn(history, raw, new Set(["set_data_route"]));

    // Assert
    if (result.status !== "pending_action") throw new Error(result.status);
    expect(result.pendingAction).toEqual({
      toolName: "set_data_route",
      toolCallId: "pending",
      input,
    });
    const answer = JSON.stringify(result.messages.at(-1));
    expect(answer).toContain("duplicate_of_pending");
    expect(answer).not.toContain("one_action_at_a_time");
    expect(answer).not.toContain("Ask the user about it again");
  });

  it.each([
    [
      "a copy of the pending call",
      ["sleep", "sleep", "hrv"],
      ["duplicate_of_pending", "one_action_at_a_time"],
    ],
    [
      "a copy of an earlier extra",
      ["sleep", "hrv", "hrv"],
      ["one_action_at_a_time", "duplicate_action"],
    ],
  ])(
    "should answer %s as a duplicate and count only distinct deferred actions",
    (_label, dataTypes, errors) => {
      // Arrange
      const raw = rawTurn({
        finishReason: "tool-calls",
        toolCalls: dataTypes.map((dataType, i) => ({
          toolName: "set_data_route",
          toolCallId: `c${i}`,
          input: { dataType },
        })),
      });

      // Act
      const result = classifyTurn(history, raw, new Set(["set_data_route"]));

      // Assert
      if (result.status !== "pending_action") throw new Error(result.status);
      expect(result.pendingAction.toolCallId).toBe("c0");
      expect(result.pendingAction.deferredCount).toBe(1);
      const tool = result.messages.at(-1) as {
        content: Array<{ output: { value: { error: string } } }>;
      };
      expect(tool.content.map((p) => p.output.value.error)).toEqual(errors);
    }
  );

  it("should add no tool message when the step holds a single action call", () => {
    // Arrange
    const raw = rawTurn({
      finishReason: "tool-calls",
      toolCalls: [{ toolName: "sync_coaching", toolCallId: "c1", input: {} }],
    });

    // Act
    const result = classifyTurn(history, raw, new Set(["sync_coaching"]));

    // Assert
    expect(result.messages).toEqual([...history, ...response]);
  });
});
