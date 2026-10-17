import { streamText, stepCountIs } from "ai";
import type { LanguageModel, ModelMessage, ToolSet } from "ai";
import type { ChatUsage } from "./chat-types";
import { createTurnStats, stoppedTurn } from "./turn-stats";
import { createTurnWatchdog, type TurnStopCause } from "./turn-watchdog";

/** Normalized result of a single AI SDK turn, decoupled from the SDK shape. */
export type RawTurn = {
  text: string;
  toolCalls: Array<{ toolName: string; toolCallId: string; input: unknown }>;
  finishReason: string;
  usage?: ChatUsage;
  /** Response messages produced this turn (assistant text + tool parts). */
  messages: ModelMessage[];
  /** Set when the caller's signal or the watchdog halted the turn. */
  stopped?: TurnStopCause;
  /** Completed model steps and the tool names they called, for telemetry. */
  steps: number;
  toolNames: string[];
};

export type RunTurnParams = {
  model: LanguageModel;
  system?: string;
  messages: ModelMessage[];
  tools: ToolSet;
  maxSteps: number;
  onTextDelta?: (delta: string) => void;
  abortSignal?: AbortSignal;
  /** Watchdog deadline for the whole turn; omitted means no deadline. */
  timeoutMs?: number;
};

/**
 * Single seam over the AI SDK. Runs the multi-step tool loop (read tools
 * auto-execute; an action tool with no `execute` halts the loop), streams
 * text deltas to `onTextDelta`, then resolves the normalized turn.
 *
 * A provider failure arrives as a stream `error` part, not a thrown error:
 * the SDK hands it to `onError`. With no completed step it then rejects the
 * result promises with a generic `NoOutputGeneratedError`, dropping the
 * `APICallError` and its `statusCode`; after a completed step it resolves
 * with that step's data and the failure is lost. The first stream error is
 * captured here and rethrown in both cases, so callers see and can classify
 * the real failure. (Tool failures are `tool-error` parts, not `error` parts,
 * and stay in the loop.) Capturing it also replaces the SDK's default
 * `onError` (`console.error`), which would log the request body.
 *
 * An abort (caller signal or watchdog) ends `textStream` quietly and rejects
 * the result promises with the abort reason, so a stop is detected first and
 * resolved as a `stopped` turn holding the text streamed so far.
 */
export const runTurn = async (params: RunTurnParams): Promise<RawTurn> => {
  const watchdog = createTurnWatchdog(params.abortSignal, params.timeoutMs);
  try {
    return await streamTurn(params, watchdog.signal, watchdog.cause);
  } finally {
    watchdog.dispose();
  }
};

const streamTurn = async (
  params: RunTurnParams,
  abortSignal: AbortSignal,
  stopCause: () => TurnStopCause | undefined
): Promise<RawTurn> => {
  let streamError: unknown;
  let streamed = "";
  const stats = createTurnStats();
  const result = streamText({
    model: params.model,
    system: params.system,
    messages: params.messages,
    tools: params.tools,
    stopWhen: stepCountIs(params.maxSteps),
    // We own retries at the call-site; disable the SDK's internal layer so a
    // retryable error costs one HTTP call per turn, not N.
    maxRetries: 0,
    abortSignal,
    onStepEnd: stats.onStepEnd,
    onError: ({ error }) => {
      streamError ??= error;
    },
  });

  const settled = async () => {
    for await (const delta of result.textStream) {
      streamed += delta;
      params.onTextDelta?.(delta);
    }
    return Promise.all([
      result.text,
      result.toolCalls,
      result.finishReason,
      result.usage,
      result.response,
    ]);
  };
  const outcome = await settled().catch((e: unknown) => {
    if (stopCause()) return undefined;
    throw streamError ?? e;
  });
  if (!outcome) return stoppedTurn(stopCause() ?? "aborted", streamed, stats);
  if (streamError !== undefined) throw streamError;
  const [text, toolCalls, finishReason, usage, response] = outcome;

  return {
    text,
    // A call whose input failed its schema is marked `invalid`: the SDK
    // already answered it with a tool-error and the loop moved on, so it must
    // never be offered for confirmation.
    toolCalls: toolCalls
      .filter((c) => !("invalid" in c && c.invalid))
      .map((c) => ({
        toolName: c.toolName,
        toolCallId: c.toolCallId,
        input: c.input,
      })),
    finishReason,
    usage: usage
      ? {
          promptTokens: usage.inputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
        }
      : undefined,
    messages: response.messages,
    steps: stats.steps(),
    toolNames: stats.toolNames(),
  };
};
