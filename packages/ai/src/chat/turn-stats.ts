import type { StepResult, ToolSet } from "ai";
import type { ChatUsage } from "./chat-types";
import type { RawTurn } from "./run-turn";
import type { TurnStopCause } from "./turn-watchdog";

/** Metrics of the steps a turn completed — never their payloads. */
export type TurnMetrics = {
  steps: number;
  toolNames: string[];
  /** Summed usage of the completed steps; `undefined` before the first. */
  usage?: ChatUsage;
};

export type TurnStats = {
  onStepEnd: (step: StepResult<ToolSet>) => void;
  snapshot: () => TurnMetrics;
};

const isInvalid = (call: object) => "invalid" in call && Boolean(call.invalid);

/**
 * Accumulates per-step metrics from the SDK's step events. Only calls to a
 * tool in `registered` with a schema-valid input are named: a model can call
 * a name it made up, and that string is model output, not a tool id.
 *
 * Usage is the provider-reported total of each FINISHED step. A step cut by
 * an abort or the watchdog never reports usage (providers send it with the
 * final chunk), so its tokens are not counted.
 */
export const createTurnStats = (registered: ToolSet): TurnStats => {
  let steps = 0;
  const toolNames: string[] = [];
  const usage: ChatUsage = { promptTokens: 0, completionTokens: 0 };
  return {
    onStepEnd: (step) => {
      steps += 1;
      for (const call of step.toolCalls)
        if (Object.hasOwn(registered, call.toolName) && !isInvalid(call))
          toolNames.push(call.toolName);
      usage.promptTokens += step.usage.inputTokens ?? 0;
      usage.completionTokens += step.usage.outputTokens ?? 0;
    },
    snapshot: () => ({
      steps,
      toolNames: [...toolNames],
      ...(steps > 0 ? { usage: { ...usage } } : {}),
    }),
  };
};

const ERROR_METRICS = new WeakMap<object, TurnMetrics>();

/**
 * Tags a thrown turn error with the metrics of the steps that finished before
 * it, without wrapping it: callers still classify the provider's own error.
 */
export const attachTurnMetrics = (error: unknown, metrics: TurnMetrics) => {
  if (typeof error === "object" && error !== null)
    ERROR_METRICS.set(error, metrics);
};

export const turnMetricsOf = (error: unknown): TurnMetrics | undefined =>
  typeof error === "object" && error !== null
    ? ERROR_METRICS.get(error)
    : undefined;

/**
 * The turn a stop leaves behind: the streamed text as one plain assistant
 * message. Completed tool steps are dropped from `messages` on purpose — a
 * half-run step could leave a tool call with no result, which no provider
 * accepts on the next turn — while their text survives in `streamed`.
 */
export const stoppedTurn = (
  cause: TurnStopCause,
  streamed: string,
  metrics: TurnMetrics
): RawTurn => ({
  text: streamed,
  toolCalls: [],
  finishReason: cause,
  usage: metrics.usage,
  messages: streamed ? [{ role: "assistant", content: streamed }] : [],
  stopped: cause,
  steps: metrics.steps,
  toolNames: metrics.toolNames,
});
