import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import type { AiModelPurpose } from "../../../types/ai-model-binding";
import { type EffectiveModel, effectiveModel } from "./effective-models";

/** The active athlete's providers and, per purpose, what runs. */
export const useEffectiveModels = (purposes: readonly AiModelPurpose[]) => {
  const profileId = useActiveProfileLive()?.id ?? null;
  const providers = useAiProvidersLive() ?? [];
  const bindings = useAiModelBindingsLive(profileId) ?? [];
  const models: Record<string, EffectiveModel> = {};
  for (const purpose of purposes) {
    models[purpose] = effectiveModel(purpose, providers, bindings);
  }
  return { profileId, providers, models };
};
