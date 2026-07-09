/**
 * runLabExtraction — resolve the profile's lab-extraction model and run the
 * frozen lab-extractor agent over one uploaded document, returning the raw
 * extraction. Mapping the extraction to the entry-form draft is a UI concern
 * and stays in the labs component layer, so this use case never depends on it.
 * Returns a typed no-provider result instead of throwing for the expected "no
 * model configured" case; a run failure propagates as a throw.
 */
import {
  type AgentFileInput,
  type LabExtraction,
  labExtractorAgent,
  runGenerateAgent,
} from "@kaiord/ai/agents";
import {
  createLanguageModel,
  resolveModelForPurpose,
} from "@kaiord/ai/providers";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { AiModelBinding } from "../../../types/ai-model-binding";

export type RunLabExtractionInput = {
  file: AgentFileInput;
  providers: LlmProviderConfig[];
  bindings: AiModelBinding[];
  signal?: AbortSignal;
};

export type RunLabExtractionResult =
  | { ok: true; extraction: LabExtraction }
  | { ok: false; reason: "no_provider" };

export const runLabExtraction = async (
  input: RunLabExtractionInput
): Promise<RunLabExtractionResult> => {
  const resolved = resolveModelForPurpose(
    "lab_extraction",
    input.providers,
    input.bindings
  );
  if (!resolved) return { ok: false, reason: "no_provider" };

  const model = await createLanguageModel(resolved.provider, resolved.modelId, {
    browser: true,
  });
  const { output } = await runGenerateAgent(
    labExtractorAgent,
    { files: [input.file] },
    { model, signal: input.signal }
  );
  return { ok: true, extraction: output };
};
