/**
 * Model catalog surface. Re-exports the SDK-sourced generated catalog and
 * derives the default model per provider type. The catalog is produced by
 * `pnpm generate:model-catalog`; never hand-maintain model lists here.
 */
import { DEPRECATED_MODELS, RETIRED_MODELS } from "./generated/model-catalog";
import type { LlmProviderType, ModelDeprecation } from "./types";

export {
  DEPRECATED_MODELS,
  MODEL_CATALOG,
  MODEL_CATALOG as PROVIDER_MODELS,
  RETIRED_MODELS,
} from "./generated/model-catalog";

/**
 * Curated default per provider type. The catalog order follows the SDK union
 * (oldest first), so no catalog position is a sensible default. A test pins
 * each entry to the catalog, so a stale default fails CI instead of silently
 * falling back to a preview or alias.
 */
export const PREFERRED_DEFAULT_MODELS: Record<LlmProviderType, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-5-mini",
  google: "gemini-2.5-flash",
};

export const getDefaultModel = (type: LlmProviderType): string =>
  PREFERRED_DEFAULT_MODELS[type];

/** True when the provider no longer serves `modelId` (it answers 404). */
export const isRetiredModel = (
  type: LlmProviderType,
  modelId: string
): boolean => Object.hasOwn(RETIRED_MODELS[type], modelId);

/** The same-tier successor of a retired model, else undefined. */
export const retiredSuccessor = (
  type: LlmProviderType,
  modelId: string
): string | undefined =>
  isRetiredModel(type, modelId) ? RETIRED_MODELS[type][modelId] : undefined;

/** Successor + retirement date of a deprecated model, else undefined. */
export const deprecationOf = (
  type: LlmProviderType,
  modelId: string
): ModelDeprecation | undefined =>
  Object.hasOwn(DEPRECATED_MODELS[type], modelId)
    ? DEPRECATED_MODELS[type][modelId]
    : undefined;

/** `modelId`, or its successor when the provider retired it. */
export const usableModel = (type: LlmProviderType, modelId: string): string =>
  retiredSuccessor(type, modelId) ?? modelId;

/**
 * The model to call for a provider record: its stored choice, else the type
 * default, healed past retirement. The ONE place `provider.model` meets the
 * default — a guard bans the raw `.model ?? getDefaultModel(` pattern
 * elsewhere, because it skips the healing.
 */
export const modelForProvider = (provider: {
  type: LlmProviderType;
  model?: string;
}): string =>
  usableModel(provider.type, provider.model ?? getDefaultModel(provider.type));
