/**
 * The `GenerateKrdPort` the coaching dialog hands the use case. No React.
 * It picks its `LlmProviderConfig` only when the AI is asked, so a build
 * the steps table answers never needs a provider.
 */
import type { OnGenerateProgress } from "@kaiord/ai";
import { PROMPT_VERSION } from "@kaiord/ai/prompts";

import { NoAiProviderError } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import type { GenerateKrdPort } from "../../../application/coaching/convert-coaching-activity-with-ai";
import {
  generateWorkoutKrd,
  type GenerationDeps,
} from "../../../lib/generate-workout";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { Sport } from "../../../types/schemas";
import { sportSchema } from "../../../types/schemas";

const isKnownSport = (s: string): s is Sport =>
  sportSchema.safeParse(s).success;

/** The provider and model a build runs on. */
export type AiModelChoice = { provider: LlmProviderConfig; modelId: string };

/** `null` when no provider is configured for workout generation. */
export type ChooseAiModel = () => AiModelChoice | null;

export type AiRunHooks = {
  /** Called once the AI is about to be asked, with the model it runs on. */
  onAiStart?: (choice: AiModelChoice) => void;
  onProgress?: OnGenerateProgress;
};

/** No provider configured fails the call with `NoAiProviderError`. */
export const buildGenerateKrdPort = (
  deps: GenerationDeps,
  chooseModel: ChooseAiModel,
  now: () => string,
  hooks: AiRunHooks = {}
): GenerateKrdPort => {
  return async ({ text, sport, abortSignal }) => {
    const choice = chooseModel();
    if (!choice) throw new NoAiProviderError();
    hooks.onAiStart?.(choice);
    const krd = await generateWorkoutKrd({
      deps,
      text,
      provider: choice.provider,
      modelId: choice.modelId,
      sport: isKnownSport(sport) ? sport : undefined,
      abortSignal,
      onProgress: hooks.onProgress,
    });
    return {
      krd,
      aiMeta: {
        provider: choice.provider.type,
        model: choice.modelId,
        promptVersion: PROMPT_VERSION,
        processedAt: now(),
      },
    };
  };
};
