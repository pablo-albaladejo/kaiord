/**
 * Model catalog surface. Re-exports the SDK-sourced generated catalog and
 * derives the default model per provider type. The catalog is produced by
 * `pnpm generate:model-catalog`; never hand-maintain model lists here.
 */
import { MODEL_CATALOG, RETIRED_MODELS } from "./generated/model-catalog";
import type { LlmProviderType } from "./types";

export {
  MODEL_CATALOG,
  MODEL_CATALOG as PROVIDER_MODELS,
  RETIRED_MODELS,
} from "./generated/model-catalog";

/**
 * Curated default per provider type. The catalog order follows the SDK union
 * (oldest first), so its first entry is never a sensible default.
 */
export const PREFERRED_DEFAULT_MODELS: Record<LlmProviderType, string> = {
  anthropic: "claude-sonnet-4-5",
  openai: "gpt-5-mini",
  google: "gemini-2.5-flash",
};

export const getDefaultModel = (type: LlmProviderType): string => {
  const catalog = MODEL_CATALOG[type];
  const preferred = PREFERRED_DEFAULT_MODELS[type];
  if (catalog.some((m) => m.id === preferred)) return preferred;
  return catalog[catalog.length - 1]?.id ?? "";
};

/** True when the provider no longer serves `modelId` (it answers 404). */
export const isRetiredModel = (
  type: LlmProviderType,
  modelId: string
): boolean => RETIRED_MODELS[type].includes(modelId);

/** `modelId`, or the type's default when the provider retired it. */
export const usableModel = (type: LlmProviderType, modelId: string): string =>
  isRetiredModel(type, modelId) ? getDefaultModel(type) : modelId;
