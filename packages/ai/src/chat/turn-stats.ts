import type { StepResult, ToolSet } from "ai";
import { toUsage } from "../agents/attempt-usage";
import type {
  AiRequest,
  AiRequestOutcome,
} from "../observability/telemetry-types";
import type { ChatUsage } from "./chat-types";
import type { RawTurn } from "./run-turn";
import type { TurnStopCause } from "./turn-watchdog";

/** Metrics of the steps a turn completed — never their payloads. */
export type TurnMetrics = {
  steps: number;
  toolNames: string[];
  /** Summed usage of the completed steps; `undefined` before the first. */
  usage?: ChatUsage;
  /** One per step started: a finished step with its usage, a cut one without. */
  requests: AiRequest[];
};

/** How a step still running when the turn ended is reported. */
type CutOutcome = Extract<AiRequestOutcome, "error" | "stopped">;

export type TurnStats = {
  onStepStart: () => void;
  onStepEnd: (step: StepResult<ToolSet>) => void;
  snapshot: (cut?: CutOutcome) => TurnMetrics;
};

const isInvalid = (call: object) => "invalid" in call && Boolean(call.invalid);

/**
 * Accumulates per-step metrics from the SDK's step events. Only calls to a
 * tool in `registered` with a schema-valid input are named: a model can call
 * a name it made up, and that string is model output, not a tool id.
 *
 * Usage is the provider-reported total of each FINISHED step. A step cut by
 * an error, an abort or the watchdog never reports usage (providers send it
 * with the final chunk): it is listed as a request with no usage, so the cost
 * says it is unmeasured instead of counting it as zero.
 */
export const createTurnStats = (registered: ToolSet): TurnStats => {
  let started = 0;
  const toolNames: string[] = [];
  const requests: AiRequest[] = [];
  const usage: ChatUsage = { promptTokens: 0, completionTokens: 0 };
  return {
    onStepStart: () => {
      started += 1;
    },
    onStepEnd: (step) => {
      for (const call of step.toolCalls)
        if (Object.hasOwn(registered, call.toolName) && !isInvalid(call))
          toolNames.push(call.toolName);
      const billed = toUsage(step.usage);
      requests.push({ outcome: "ok", usage: billed });
      usage.promptTokens += billed.promptTokens;
      usage.completionTokens += billed.completionTokens;
    },
    snapshot: (cut) => {
      const steps = requests.length;
      const inFlight = cut ? Math.max(0, started - steps) : 0;
      return {
        steps,
        toolNames: [...toolNames],
        ...(steps > 0 ? { usage: { ...usage } } : {}),
        requests: [
          ...requests,
          ...Array.from({ length: inFlight }, () => ({ outcome: cut! })),
        ],
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
