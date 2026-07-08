/**
 * Resolves the provider + model for an AI purpose: the purpose's own binding,
 * else the `default` binding, else the default provider paired with its stored
 * model (transitional back-compat) or the catalog's default model, else null.
 * A binding whose provider no longer exists is skipped. The single resolution
 * path shared by chat, generation, coaching, and batch. Generic over the
 * concrete provider record so callers keep their full provider type.
 */
import { getDefaultModel } from "./provider-models";
import type {
  AiModelBinding,
  AiModelPurpose,
  ResolvableProvider,
  ResolvedModel,
} from "./types";

const fromBinding = <P extends ResolvableProvider>(
  binding: AiModelBinding | undefined,
  providers: P[]
): ResolvedModel<P> | undefined => {
  if (!binding) return undefined;
  const provider = providers.find((p) => p.id === binding.providerId);
  return provider ? { provider, modelId: binding.modelId } : undefined;
};

const fromDefaultProvider = <P extends ResolvableProvider>(
  providers: P[]
): ResolvedModel<P> | undefined => {
  const provider = providers.find((p) => p.isDefault) ?? providers[0];
  if (!provider) return undefined;
  // Prefer the provider's stored model (a migrated/legacy choice) over the
  // catalog default while a stored model is still carried.
  return {
    provider,
    modelId: provider.model ?? getDefaultModel(provider.type),
  };
};

export const resolveModelForPurpose = <P extends ResolvableProvider>(
  purpose: AiModelPurpose,
  providers: P[],
  bindings: AiModelBinding[]
): ResolvedModel<P> | null => {
  const override = bindings.find((b) => b.purpose === purpose);
  const fallback = bindings.find((b) => b.purpose === "default");
  return (
    fromBinding(override, providers) ??
    fromBinding(fallback, providers) ??
    fromDefaultProvider(providers) ??
    null
  );
};
