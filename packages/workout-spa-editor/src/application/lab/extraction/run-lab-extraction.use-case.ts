/**
 * runLabExtraction — resolve the profile's lab-extraction model and run the
 * frozen lab-extractor agent over one uploaded document, returning the raw
 * extraction. Mapping the extraction to the entry-form draft is a UI concern
 * and stays in the labs component layer, so this use case never depends on it.
 * The document is health data: it goes only once the athlete lets its
 * Provider have it (`askHealth`), and not at all when they do not. Returns a
 * typed result instead of throwing for "no model configured" and for
 * "withheld"; a run failure propagates as a throw. A run that reaches the
 * Provider leaves one Trace (`trace`), finished here whatever the outcome; a
 * run stopped while the athlete is asked leaves a stopped one; a withheld
 * document leaves none.
 */
import {
  type AgentFileInput,
  type LabExtraction,
  labExtractorAgent,
  runGenerateAgent,
} from "@kaiord/ai/agents";
import type { AiTelemetrySink } from "@kaiord/ai/observability";
import {
  createLanguageModel,
  type LlmProviderType,
  resolveModelForPurpose,
} from "@kaiord/ai/providers";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import type { HealthShare } from "../../data-flows/data-flows";
import { kindsSent } from "../../data-flows/kinds-sent";
import type { TraceRun } from "../../trace/trace-run";

export type RunLabExtractionInput = {
  file: AgentFileInput;
  providers: LlmProviderConfig[];
  bindings: AiModelBinding[];
  signal?: AbortSignal;
  telemetry?: AiTelemetrySink;
  trace?: TraceRun;
  askHealth: (providerType: LlmProviderType) => Promise<HealthShare>;
};

export type RunLabExtractionResult =
  | { ok: true; extraction: LabExtraction }
  | { ok: false; reason: "no_provider" | "withheld" };

export const runLabExtraction = async (
  input: RunLabExtractionInput
): Promise<RunLabExtractionResult> => {
  const resolved = resolveModelForPurpose(
    "lab_extraction",
    input.providers,
    input.bindings
  );
  if (!resolved) return { ok: false, reason: "no_provider" };
  const { trace } = input;
  const share = await input
    .askHealth(resolved.provider.type)
    .catch(async (error: unknown) => {
      await trace?.finish("stopped");
      throw error;
    });
  if (share === "withhold") {
    await trace?.discard();
    return { ok: false, reason: "withheld" };
  }

  try {
    const model = await createLanguageModel(
      resolved.provider,
      resolved.modelId,
      {
        browser: true,
      }
    );
    trace?.sent(resolved.provider.type, kindsSent("labImport", true));
    const telemetry = trace ? trace.sink(input.telemetry) : input.telemetry;
    const { output } = await runGenerateAgent(
      labExtractorAgent,
      { files: [input.file] },
      { model, signal: input.signal, telemetry }
    );
    await trace?.finish();
    return { ok: true, extraction: output };
  } catch (error) {
    await trace?.finish(input.signal?.aborted ? "stopped" : "failed");
    throw error;
  }
};
