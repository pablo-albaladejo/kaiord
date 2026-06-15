/**
 * Model catalog surface. Re-exports the SDK-sourced generated catalog and
 * derives the default model per provider type. The catalog is produced by
 * `pnpm generate:model-catalog`; never hand-maintain model lists here.
 */
import type { LlmProviderType } from "../store/ai-store-types";
import { MODEL_CATALOG } from "./generated/model-catalog";

export type { ModelOption } from "./generated/model-catalog";
export { MODEL_CATALOG as PROVIDER_MODELS } from "./generated/model-catalog";

export const getDefaultModel = (type: LlmProviderType): string =>
  MODEL_CATALOG[type][0]?.id ?? "";
