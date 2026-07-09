import type { LanguageModel } from "ai";
import type { Logger } from "@kaiord/core";
import type {
  AgentDefinition,
  GenerateAgentInput,
  GenerateAgentResult,
} from "./definition-types";
import type { AiTelemetrySink } from "../observability/telemetry-types";
import { createNoopTelemetrySink } from "../observability/noop-sink";
import { modelIdOf, providerOf, resolveSystemPrompt } from "./prelude";
import { runGenerateLoop } from "./generate-mode";
import { AiAgentError } from "./errors";

export type GenerateAgentConfig = {
  model: LanguageModel;
  telemetry?: AiTelemetrySink;
  logger?: Logger;
  signal?: AbortSignal;
};

/**
 * Executes a generate-mode agent: resolves the system prompt, runs the
 * validate-and-retry loop, and emits exactly one telemetry event (finished or
 * failed) carrying ids, versions, and metrics only — never payloads.
 */
export const runGenerateAgent = async <TOutput>(
  definition: AgentDefinition<TOutput>,
  input: GenerateAgentInput,
  config: GenerateAgentConfig
): Promise<GenerateAgentResult<TOutput>> => {
  const telemetry = config.telemetry ?? createNoopTelemetrySink();
  const { system, promptVersion } = resolveSystemPrompt(definition);
  const traceId = crypto.randomUUID();
  const start = Date.now();
  const identity = {
    traceId,
    agentId: definition.id,
    agentVersion: definition.version,
    promptId: definition.systemPrompt.id,
    promptVersion,
    provider: providerOf(config.model),
    modelId: modelIdOf(config.model),
    purpose: definition.purpose,
  };

  try {
    const { output, usage } = await runGenerateLoop({
      model: config.model,
      system,
      input,
      definition,
      signal: config.signal,
      onAttemptError: (attempt, error) =>
        config.logger?.warn("Agent attempt failed", { attempt, error }),
    });
    const latencyMs = Date.now() - start;
    telemetry.emit({ type: "run_finished", ...identity, latencyMs, usage });
    return { output, usage, traceId };
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    telemetry.emit({
      type: "run_failed",
      ...identity,
      latencyMs: Date.now() - start,
      error: { name, retriable: error instanceof AiAgentError },
    });
    throw error;
  }
};
