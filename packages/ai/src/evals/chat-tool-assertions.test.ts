import { describe, expect, it } from "vitest";

import type { ChatTurnResult } from "../index";
import { EVAL_DURATION_MS_DEFAULT } from "../test-utils/constants";
import benchmarks from "./chat-tool-benchmarks.json";
import {
  evaluateChatToolBenchmark,
  expectationFault,
} from "./chat-tool-assertions";
import type { ChatToolBenchmark } from "./chat-tool-types";

const readBenchmark: ChatToolBenchmark = {
  id: "read-1",
  userText: "where do my planned sessions come from?",
  category: "read",
  expectedTool: "get_data_routes",
  expectedAnswerIncludes: ["train2go"],
};

const actionBenchmark: ChatToolBenchmark = {
  id: "action-1",
  userText: "read sleep only from whoop",
  category: "action",
  expectedTool: "set_data_route",
  expectedActionInput: {
    action: "set_source_policy",
    dataType: "sleep",
    mode: "priority",
  },
};

const completeWithToolCall = (
  text: string,
  toolName: string
): ChatTurnResult => ({
  status: "complete",
  text,
  messages: [
    {
      role: "assistant",
      content: [{ type: "tool-call", toolCallId: "c1", toolName, input: {} }],
    },
  ],
});

describe("evaluateChatToolBenchmark — read scenario", () => {
  it("should pass when the expected tool was called and the answer names the source", () => {
    // Arrange
    const result = completeWithToolCall(
      "Your planned sessions come from Train2Go.",
      "get_data_routes"
    );

    // Act
    const evalResult = evaluateChatToolBenchmark(
      readBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(true);
    expect(evalResult.errors).toHaveLength(0);
    expect(evalResult.toolCalled).toBe("get_data_routes");
  });

  it("should fail when the expected tool was never called", () => {
    // Arrange
    const result: ChatTurnResult = {
      status: "complete",
      text: "Your planned sessions come from Train2Go.",
      messages: [],
    };

    // Act
    const evalResult = evaluateChatToolBenchmark(
      readBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(false);
    expect(evalResult.errors.some((e) => e.includes("get_data_routes"))).toBe(
      true
    );
  });

  it("should fail when the answer never names the real source", () => {
    // Arrange
    const result = completeWithToolCall(
      "I don't have that information.",
      "get_data_routes"
    );

    // Act
    const evalResult = evaluateChatToolBenchmark(
      readBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(false);
    expect(evalResult.errors.some((e) => e.includes("train2go"))).toBe(true);
  });

  it("should fail when the turn is still pending an action instead of complete", () => {
    // Arrange
    const result: ChatTurnResult = {
      status: "pending_action",
      pendingAction: {
        toolName: "set_data_route",
        toolCallId: "c1",
        input: {},
      },
      messages: [],
    };

    // Act
    const evalResult = evaluateChatToolBenchmark(
      readBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(false);
  });
});

describe("evaluateChatToolBenchmark — action scenario", () => {
  it("should pass when the pending action matches the expected tool and input", () => {
    // Arrange
    const result: ChatTurnResult = {
      status: "pending_action",
      pendingAction: {
        toolName: "set_data_route",
        toolCallId: "c1",
        input: {
          action: "set_source_policy",
          dataType: "sleep",
          mode: "priority",
          sourceOrder: ["whoop"],
        },
      },
      messages: [],
    };

    // Act
    const evalResult = evaluateChatToolBenchmark(
      actionBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(true);
    expect(evalResult.toolCalled).toBe("set_data_route");
  });

  it("should fail when a different tool is proposed", () => {
    // Arrange
    const result: ChatTurnResult = {
      status: "pending_action",
      pendingAction: {
        toolName: "push_to_garmin",
        toolCallId: "c1",
        input: {},
      },
      messages: [],
    };

    // Act
    const evalResult = evaluateChatToolBenchmark(
      actionBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(false);
    expect(evalResult.errors.some((e) => e.includes("push_to_garmin"))).toBe(
      true
    );
  });

  it("should fail when the proposed input has the wrong mode", () => {
    // Arrange
    const result: ChatTurnResult = {
      status: "pending_action",
      pendingAction: {
        toolName: "set_data_route",
        toolCallId: "c1",
        input: {
          action: "set_source_policy",
          dataType: "sleep",
          mode: "union",
        },
      },
      messages: [],
    };

    // Act
    const evalResult = evaluateChatToolBenchmark(
      actionBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(false);
    expect(evalResult.errors.some((e) => e.includes("mode"))).toBe(true);
  });

  it("should fail when the turn completed instead of pausing for confirmation", () => {
    // Arrange
    const result: ChatTurnResult = {
      status: "complete",
      text: "Done.",
      messages: [],
    };

    // Act
    const evalResult = evaluateChatToolBenchmark(
      actionBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(false);
  });
});

describe("evaluateChatToolBenchmark — step limit", () => {
  it("should fail regardless of category when the turn hits the step limit", () => {
    // Arrange
    const result: ChatTurnResult = {
      status: "step_limit",
      text: "",
      messages: [],
    };

    // Act
    const evalResult = evaluateChatToolBenchmark(
      readBenchmark,
      result,
      EVAL_DURATION_MS_DEFAULT
    );

    // Assert
    expect(evalResult.pass).toBe(false);
    expect(evalResult.errors[0]).toContain("step limit");
  });
});

describe("expectationFault", () => {
  const base = {
    id: "x",
    userText: "hi",
    category: "read" as const,
    expectedTool: "get_data_routes",
  };

  it("should report no fault when expectations are absent", () => {
    // Arrange
    const benchmark = base;

    // Act
    const fault = expectationFault(benchmark);

    // Assert
    expect(fault).toBeNull();
  });

  it("should report no fault when expectations are well formed", () => {
    // Arrange
    const benchmark = { ...base, expectedAnswerIncludes: ["train2go"] };

    // Act
    const fault = expectationFault(benchmark);

    // Assert
    expect(fault).toBeNull();
  });

  it("should fault when a phrase list arrives as a bare string", () => {
    // Arrange
    const benchmark = {
      ...base,
      expectedAnswerIncludes: "train2go" as unknown as string[],
    };

    // Act
    const fault = expectationFault(benchmark);

    // Assert
    expect(fault).toContain("not an array");
  });

  it("should fault when an action input arrives as an array", () => {
    // Arrange
    const benchmark = {
      ...base,
      category: "action" as const,
      expectedActionInput: [] as unknown as Record<string, unknown>,
    };

    // Act
    const fault = expectationFault(benchmark);

    // Assert
    expect(fault).toContain("not an object");
  });

  it("should fault when a phrase list holds a non-string entry", () => {
    // Arrange
    const benchmark = {
      ...base,
      expectedAnswerIncludes: [1] as unknown as string[],
    };

    // Act
    const fault = expectationFault(benchmark);

    // Assert
    expect(fault).toContain("non-string");
  });
});

describe("chat-tool-benchmarks.json", () => {
  it("should declare every expectation in a shape the scorer understands", () => {
    // Arrange
    const fixture = benchmarks as ChatToolBenchmark[];

    // Act
    const faults = fixture
      .map((b) => ({ id: b.id, fault: expectationFault(b) }))
      .filter((f) => f.fault !== null);

    // Assert
    expect(faults).toEqual([]);
  });

  it("should declare the expectation its category is scored on", () => {
    // Arrange
    const fixture = benchmarks as ChatToolBenchmark[];

    // Act
    const undeclared = fixture.filter((b) =>
      b.category === "action"
        ? b.expectedActionInput === undefined
        : b.expectedAnswerIncludes === undefined
    );

    // Assert
    expect(undeclared.map((b) => b.id)).toEqual([]);
  });
});
