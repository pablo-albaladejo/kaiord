import type { StepResult, ToolSet } from "ai";
import { toUsage } from "../agents/attempt-usage";
import { streamedChars } from "../agents/cut-request";
import { sumUsage } from "../observability/sum-usage";
import type { AiRequest } from "../observability/telemetry-types";
import { inFlightRequest } from "./in-flight-request";
import type { ChatUsage } from "./chat-types";
import type { RawTurn } from "./run-turn";
import type { TurnStopCause } from "./turn-watchdog";

/** Metrics of the steps a turn completed — never their payloads. */
export type TurnMetrics = {
  steps: number;
  toolNames: string[];
  /** Summed usage of the completed steps; `undefined` before the first. */
  usage?: ChatUsage;
  /** One per step started: a finished step with its usage, a cut one estimated. */
  requests: AiRequest[];
};

/**
 * How a step still running when the turn ended is reported: `stopped` for
 * the athlete's Stop, `timeout` for the watchdog, `error` for a thrown
 * failure.
 */
export type TurnCut = "stopped" | "timeout" | "error";

export type TurnStats = {
  onStepStart: () => void;
  onChunk: (chunk: object) => void;
  onStepEnd: (step: StepResult<ToolSet>) => void;
  snapshot: (cut?: TurnCut) => TurnMetrics;
};

const isInvalid = (call: object) => "invalid" in call && Boolean(call.invalid);

/**
 * Accumulates per-step metrics from the SDK's step events. Only calls to a
 * tool in `registered` with a schema-valid input are named: a model can call
 * a name it made up, and that string is model output, not a tool id.
 *
 * Usage is the provider-reported total of each FINISHED step. A step cut
 * before its final chunk never reports usage, yet the Provider bills it: it
 * is listed estimated (`inFlightRequest`). `sentChars` is the text the
 * turn's first request carries; each later step also carries what the
 * earlier ones streamed.
 */
export const createTurnStats = (
  registered: ToolSet,
  sentChars = 0
): TurnStats => {
  const toolNames: string[] = [];
  const requests: AiRequest[] = [];
  const flight = { started: 0, priorChars: 0, stepChars: 0 };
  return {
    onStepStart: () => {
      flight.started += 1;
      flight.stepChars = 0;
    },
    onChunk: (chunk) => {
      flight.stepChars += streamedChars(chunk);
    },
    onStepEnd: (step) => {
      for (const call of step.toolCalls)
        if (Object.hasOwn(registered, call.toolName) && !isInvalid(call))
          toolNames.push(call.toolName);
      requests.push({ outcome: "ok", usage: toUsage(step.usage) });
      flight.priorChars += flight.stepChars;
      flight.stepChars = 0;
    },
    snapshot: (cut) => {
      const steps = requests.length;
      const cutStep =
        cut && flight.started > steps
          ? inFlightRequest(cut, sentChars + flight.priorChars, flight.stepChars)
          : undefined;
      const { promptTokens, completionTokens } = sumUsage(requests);
      return {
        steps,
        toolNames: [...toolNames],
        ...(steps > 0 ? { usage: { promptTokens, completionTokens } } : {}),
        requests: [...requests, ...(cutStep ? [cutStep] : [])],
      };
    },
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
  requests: metrics.requests,
  messages: streamed ? [{ role: "assistant", content: streamed }] : [],
  stopped: cause,
  steps: metrics.steps,
  toolNames: metrics.toolNames,
});
