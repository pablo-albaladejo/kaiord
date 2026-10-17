import type { StepResult, ToolSet } from "ai";
import type { ChatUsage } from "./chat-types";
import type { RawTurn } from "./run-turn";
import type { TurnStopCause } from "./turn-watchdog";

export type TurnStats = {
  onStepEnd: (step: StepResult<ToolSet>) => void;
  steps: () => number;
  toolNames: () => string[];
  /** Summed usage of the completed steps; `undefined` before the first. */
  usage: () => ChatUsage | undefined;
};

/** Accumulates per-step metrics (never payloads) from the SDK's step events. */
export const createTurnStats = (): TurnStats => {
  let steps = 0;
  const toolNames: string[] = [];
  const usage: ChatUsage = { promptTokens: 0, completionTokens: 0 };
  return {
    onStepEnd: (step) => {
      steps += 1;
      for (const call of step.toolCalls) toolNames.push(call.toolName);
      usage.promptTokens += step.usage.inputTokens ?? 0;
      usage.completionTokens += step.usage.outputTokens ?? 0;
    },
    steps: () => steps,
    toolNames: () => [...toolNames],
    usage: () => (steps > 0 ? { ...usage } : undefined),
  };
};

/**
 * The turn a stop leaves behind: the streamed text as one plain assistant
 * message. Completed tool steps are dropped from `messages` on purpose — a
 * half-run step could leave a tool call with no result, which no provider
 * accepts on the next turn — while their text survives in `streamed`.
 */
export const stoppedTurn = (
  cause: TurnStopCause,
  streamed: string,
  stats: TurnStats
): RawTurn => ({
  text: streamed,
  toolCalls: [],
  finishReason: cause,
  usage: stats.usage(),
  messages: streamed ? [{ role: "assistant", content: streamed }] : [],
  stopped: cause,
  steps: stats.steps(),
  toolNames: stats.toolNames(),
});
