import type { LanguageModel } from "ai";
import type { Logger } from "@kaiord/core";
import type {
  AgentDefinition,
  GenerateAgentInput,
  GenerateAgentResult,
} from "./definition-types";
import type {
  AiTelemetryEvent,
  AiTelemetrySink,
} from "../observability/telemetry-types";
import { createNoopTelemetrySink } from "../observability/noop-sink";
import { modelIdOf, providerOf, resolveSystemPrompt } from "./prelude";
import { runGenerateLoop, type GenerateOutcome } from "./generate-mode";
import { AiAgentError } from "./errors";
import type { OnGenerateProgress } from "./progress";
import { createPhaseClock } from "./phase-clock";

export type GenerateAgentConfig = {
  model: LanguageModel;
  telemetry?: AiTelemetrySink;
  logger?: Logger;
  signal?: AbortSignal;
  /** Streams the output and reports each phase change (see `progress.ts`). */
  onProgress?: OnGenerateProgress;
};

/** Telemetry is best-effort: a faulty sink must never change the run's outcome. */
const emitBestEffort = (
  sink: AiTelemetrySink,
  event: AiTelemetryEvent
): void => {
  try {
    sink.emit(event);
  } catch {
    // Swallowed on purpose: see above.
  }
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

  const clock = config.onProgress && createPhaseClock(config.onProgress);

  let run: GenerateOutcome<TOutput>;
  try {
    run = await runGenerateLoop({
      model: config.model,
      system,
      input,
      definition,
      signal: config.signal,
      onProgress: clock?.observe,
      onAttemptError: (attempt, error) =>
        config.logger?.warn("Agent attempt failed", { attempt, error }),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    emitBestEffort(telemetry, {
      type: "run_failed",
      ...identity,
      latencyMs: Date.now() - start,
      timings: clock?.stop(),
      error: { name, retriable: error instanceof AiAgentError },
    });
    throw error;
  }
  const { output, usage } = run;
  emitBestEffort(telemetry, {
    type: "run_finished",
    ...identity,
    latencyMs: Date.now() - start,
    usage,
    timings: clock?.stop(),
  });
  return { output, usage, traceId };
};
