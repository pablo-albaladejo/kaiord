/**
 * Telemetry port for the agent runtime. A minimal, redaction-safe event set:
 * every event carries identifiers, versions, and metrics only — never user
 * text, document bytes, prompts, model output, or API keys. The two event
 * shapes make payload capture impossible rather than optional. Field names
 * stay mappable to OTel GenAI semantic conventions without an OTel dependency.
 */
import type { AiModelPurpose } from "../providers/types";

/** Provider-reported token counts for one run. */
export type AiUsage = {
  promptTokens: number;
  completionTokens: number;
};

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
      usage?: AiUsage;
      timings?: AiRunTimings;
    } & RunIdentity)
  | ({
      type: "run_failed";
      timings?: AiRunTimings;
      error: { name: string; retriable: boolean };
    } & RunIdentity)
  | ChatTurnFinishedEvent;

export type AiTelemetrySink = {
  emit: (event: AiTelemetryEvent) => void;
};
