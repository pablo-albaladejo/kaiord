/**
 * Declarative agent surface. An agent is data — a prompt reference, an output
 * schema, and tuning — executed by the shared generate-mode runtime. New
 * generate-style capabilities require a new definition, not new plumbing.
 */
import type { z } from "zod";
import type { AiModelPurpose } from "../providers/types";
import type { AiUsage } from "../observability/telemetry-types";

export type AgentPromptRef = {
  id: string;
  vars?: Record<string, string>;
};

export type AgentDefinition<TOutput = unknown> = {
  id: string;
  version: string;
  purpose: AiModelPurpose;
  systemPrompt: AgentPromptRef;
  mode: "generate";
  /** Permissive wire schema; the SDK structured-output hint and default gate. */
  outputSchema: z.ZodType;
  /**
   * Strict validation that OWNS the output when present: it receives the raw
   * model output (not the `outputSchema`-parsed value) and returns the typed
   * result — e.g. parse against a stricter domain schema, reindex. A throw
   * triggers a retry. When absent, `outputSchema.parse` is the gate.
   */
  validate?: (raw: unknown) => TOutput;
  maxRetries?: number;
  maxOutputTokens?: number;
  temperature?: number;
};

export type AgentFileInput = {
  data: Uint8Array;
  mediaType: string;
  filename?: string;
};

export type GenerateAgentInput = {
  text?: string;
  files?: AgentFileInput[];
};

export type GenerateAgentResult<TOutput = unknown> = {
  output: TOutput;
  usage?: AiUsage;
  traceId: string;
};
