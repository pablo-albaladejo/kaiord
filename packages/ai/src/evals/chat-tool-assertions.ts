import type { ModelMessage } from "ai";

import type { ChatTurnResult } from "../index";
import type { ChatToolBenchmark, ChatToolEvalResult } from "./chat-tool-types";

const calledTool = (messages: ModelMessage[], toolName: string): boolean =>
  messages.some(
    (m) =>
      m.role === "assistant" &&
      Array.isArray(m.content) &&
      m.content.some(
        (part) => part.type === "tool-call" && part.toolName === toolName
      )
  );

const evaluateAction = (
  benchmark: ChatToolBenchmark,
  result: ChatTurnResult
): { errors: string[]; toolCalled?: string } => {
  if (result.status !== "pending_action") {
    return { errors: [`Expected a pending action, got "${result.status}"`] };
  }
  const errors: string[] = [];
  const { toolName, input } = result.pendingAction;
  if (toolName !== benchmark.expectedTool) {
    errors.push(`Expected tool "${benchmark.expectedTool}", got "${toolName}"`);
  }
  const expected = benchmark.expectedActionInput ?? {};
  const actual = (input ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      errors.push(
        `Expected input.${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`
      );
    }
  }
  return { errors, toolCalled: toolName };
};

const evaluateRead = (
  benchmark: ChatToolBenchmark,
  result: ChatTurnResult
): { errors: string[]; toolCalled?: string } => {
  if (result.status !== "complete") {
    return { errors: [`Expected a completed turn, got "${result.status}"`] };
  }
  const errors: string[] = [];
  if (!calledTool(result.messages, benchmark.expectedTool)) {
    errors.push(`Expected tool "${benchmark.expectedTool}" to be called`);
  }
  const answer = result.text.toLowerCase();
  for (const phrase of benchmark.expectedAnswerIncludes ?? []) {
    if (!answer.includes(phrase.toLowerCase())) {
      errors.push(`Expected the answer to mention "${phrase}"`);
    }
  }
  return { errors, toolCalled: benchmark.expectedTool };
};

/**
 * Absent expectations are a clean pass; a malformed one is a harness fault.
 * The branch that treats "no expectations declared" as success is where a
 * suite goes quietly green when something reshapes the scorer's input, so a
 * value of the wrong shape must be loud rather than read as an absence.
 */
export const expectationFault = (
  benchmark: ChatToolBenchmark
): string | null => {
  const { expectedActionInput: input, expectedAnswerIncludes: phrases } =
    benchmark;
  if (
    input !== undefined &&
    (typeof input !== "object" || input === null || Array.isArray(input))
  ) {
    return `expectedActionInput is ${describe(input)}, not an object`;
  }
  if (phrases !== undefined && !Array.isArray(phrases)) {
    return `expectedAnswerIncludes is ${describe(phrases)}, not an array`;
  }
  if (Array.isArray(phrases) && phrases.some((p) => typeof p !== "string")) {
    return "expectedAnswerIncludes contains a non-string entry";
  }
  return null;
};

const describe = (value: unknown): string =>
  Array.isArray(value) ? "an array" : `a ${typeof value}`;

export const evaluateChatToolBenchmark = (
  benchmark: ChatToolBenchmark,
  result: ChatTurnResult,
  durationMs: number
): ChatToolEvalResult => {
  const fault = expectationFault(benchmark);
  if (fault !== null) {
    return {
      id: benchmark.id,
      pass: false,
      harnessFault: fault,
      errors: [`Harness fault: ${fault}`],
      durationMs,
    };
  }

  if (result.status === "step_limit") {
    return {
      id: benchmark.id,
      pass: false,
      errors: ["Hit the step limit without completing the turn"],
      durationMs,
    };
  }

  const { errors, toolCalled } =
    benchmark.category === "action"
      ? evaluateAction(benchmark, result)
      : evaluateRead(benchmark, result);

  return {
    id: benchmark.id,
    pass: errors.length === 0,
    errors,
    toolCalled,
    durationMs,
  };
};
