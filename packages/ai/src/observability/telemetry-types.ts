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

export type AiTelemetryEvent =
  | ({ type: "run_finished"; usage?: AiUsage } & RunIdentity)
  | ({
      type: "run_failed";
      error: { name: string; retriable: boolean };
    } & RunIdentity);

export type AiTelemetrySink = {
  emit: (event: AiTelemetryEvent) => void;
};
