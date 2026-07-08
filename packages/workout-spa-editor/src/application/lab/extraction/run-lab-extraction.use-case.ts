/**
 * runLabExtraction — resolve the profile's lab-extraction model, run the frozen
 * lab-extractor agent over one uploaded document, and map its output to the
 * entry-form draft. Returns a typed no-provider result instead of throwing for
 * the expected "no model configured" case; a run failure propagates as a throw.
 */
import {
  type AgentFileInput,
  labExtractorAgent,
  runGenerateAgent,
} from "@kaiord/ai/agents";
import {
  createLanguageModel,
  resolveModelForPurpose,
} from "@kaiord/ai/providers";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import { type LabDraft, mapExtractionToDraft } from "./map-extraction-to-draft";

export type RunLabExtractionInput = {
  file: AgentFileInput;
  providers: LlmProviderConfig[];
  bindings: AiModelBinding[];
  locale: string;
  signal?: AbortSignal;
};

export type RunLabExtractionResult =
  { ok: true; draft: LabDraft } | { ok: false; reason: "no_provider" };

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
  return {
    ok: true,
    draft: mapExtractionToDraft(output, { locale: input.locale }),
  };
};
