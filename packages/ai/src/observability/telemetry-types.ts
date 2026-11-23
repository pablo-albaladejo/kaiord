/**
 * Telemetry port for the agent runtime. A minimal, redaction-safe event set:
 * every event carries identifiers, versions, and metrics only — never user
 * text, document bytes, prompts, model output, or API keys. The two event
 * shapes make payload capture impossible rather than optional. Field names
 * stay mappable to OTel GenAI semantic conventions without an OTel dependency.
 */
import type { AiModelPurpose } from "../providers/types";

/**
 * Provider-reported token counts. `promptTokens` is every input token,
 * cached ones included; the cache counts say how many of them were read from
 * or written to the Provider's prompt cache.
 */
export type AiUsage = {
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

/**
 * How one request to the Provider ended: `ok`, an output that did not
 * validate (`invalid`) or was cut at the token limit (`truncated`), a thrown
 * Provider or transport failure (`error`), or a stop by abort or watchdog.
 */
export type AiRequestOutcome =
  "ok" | "invalid" | "truncated" | "error" | "stopped";

/**
 * One request that reached the Provider. `usage` is what the Provider
 * reported; it is absent when the Provider reported none (a failure before
 * the final chunk), and then the request is unmeasured, never zero.
 */
export type AiRequest = { outcome: AiRequestOutcome; usage?: AiUsage };

type RunIdentity = {
  traceId: string;
  agentId: string;
  agentVersion: string;
  promptId: string;
  promptVersion: string;
  /** SDK provider string (e.g. `anthropic.messages`); OTel `gen_ai.system`. */
  provider: string;
  modelId: string;
  purpose: AiModelPurpose;
  latencyMs: number;
};

/** How a chat turn ended; `error` covers every thrown provider failure. */
export type ChatTurnStatus =
  | "complete"
  | "pending_action"
  | "step_limit"
  | "aborted"
  | "timeout"
  | "error";

/**
 * One chat turn. `toolNames` are the app-registered tool names the model
 * called (never their inputs or outputs); token counts are provider-reported.
 */
export type ChatTurnFinishedEvent = {
  type: "chat_turn_finished";
  traceId: string;
  promptVersion: string;
  provider: string;
  modelId: string;
  steps: number;
  toolNames: string[];
  status: ChatTurnStatus;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  /** One per model step started: each finished step, plus one cut short. */
  requests: AiRequest[];
};

/**
 * Where a streamed generate run spent its time: milliseconds per progress
 * phase summed over every attempt, the attempt count, and why each retry
 * happened. Present on every run given a progress listener; a run whose model
 * cannot stream counts all its time as `requesting`.
 */
export type AiRunTimings = {
  attempts: number;
  phaseMs: Partial<
    Record<"requesting" | "reasoning" | "generating" | "validating", number>
  >;
  retryReasons: Array<"truncated" | "invalid" | "provider">;
};

export type AiTelemetryEvent =
  | ({
      type: "run_finished";
      /** Summed over every request of the run, failed attempts included. */
      usage?: AiUsage;
      timings?: AiRunTimings;
      requests: AiRequest[];
    } & RunIdentity)
  | ({
      type: "run_failed";
      timings?: AiRunTimings;
      requests: AiRequest[];
      error: { name: string; retriable: boolean };
    } & RunIdentity)
  | ChatTurnFinishedEvent;

export type AiTelemetrySink = {
  emit: (event: AiTelemetryEvent) => void;
};
