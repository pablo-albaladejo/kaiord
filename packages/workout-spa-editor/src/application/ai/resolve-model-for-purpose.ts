/**
 * Resolves the provider + model for an AI purpose: the purpose's own binding,
 * else the `default` binding, else the default provider with the catalog's
 * default model, else null. A binding whose provider no longer exists is
 * skipped. The single resolution path shared by chat, generation, coaching,
 * and batch.
 */
import { getDefaultModel } from "../../lib/provider-models";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { AiModelBinding, AiModelPurpose } from "../../types/ai-model-binding";

export type ResolvedModel = {
  provider: LlmProviderConfig;
  modelId: string;
};

const fromBinding = (
  binding: AiModelBinding | undefined,
  providers: LlmProviderConfig[]
): ResolvedModel | undefined => {
  if (!binding) return undefined;
  const provider = providers.find((p) => p.id === binding.providerId);
  return provider ? { provider, modelId: binding.modelId } : undefined;
};

const fromDefaultProvider = (
  providers: LlmProviderConfig[]
): ResolvedModel | undefined => {
  const provider = providers.find((p) => p.isDefault) ?? providers[0];
  return provider
    ? { provider, modelId: getDefaultModel(provider.type) }
    : undefined;
};

export const resolveModelForPurpose = (
  purpose: AiModelPurpose,
  providers: LlmProviderConfig[],
  bindings: AiModelBinding[]
): ResolvedModel | null => {
  const override = bindings.find((b) => b.purpose === purpose);
  const fallback = bindings.find((b) => b.purpose === "default");
  return (
    fromBinding(override, providers) ??
    fromBinding(fallback, providers) ??
    fromDefaultProvider(providers) ??
    null
  );
};
