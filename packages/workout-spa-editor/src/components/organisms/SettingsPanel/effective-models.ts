import { resolveModelForPurpose } from "@kaiord/ai/providers";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type {
  AiModelBinding,
  AiModelPurpose,
} from "../../../types/ai-model-binding";
import type { ModelChoice } from "./model-choice";

/** What a purpose runs, and whether the athlete chose it for that purpose. */
export type EffectiveModel = {
  purpose: AiModelPurpose;
  /** The provider + model that runs, as the resolver resolves it. */
  running: ModelChoice | null;
  /** The model the athlete stored for this purpose, when it is usable. */
  storedModelId: string | null;
  /** True when the purpose has no usable binding of its own. */
  inherited: boolean;
};

export const effectiveModel = (
  purpose: AiModelPurpose,
  providers: LlmProviderConfig[],
  bindings: AiModelBinding[]
): EffectiveModel => {
  const own = bindings.find(
    (b) => b.purpose === purpose && providers.some((p) => p.id === b.providerId)
  );
  const resolved = resolveModelForPurpose(purpose, providers, bindings);
  return {
    purpose,
    running: resolved
      ? { providerId: resolved.provider.id, modelId: resolved.modelId }
      : null,
    storedModelId: own?.modelId.trim() ? own.modelId : null,
    inherited: !own,
  };
};
