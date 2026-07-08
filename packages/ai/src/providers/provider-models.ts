/**
 * Model catalog surface. Re-exports the SDK-sourced generated catalog and
 * derives the default model per provider type. The catalog is produced by
 * `pnpm generate:model-catalog`; never hand-maintain model lists here.
 */
import { MODEL_CATALOG } from "./generated/model-catalog";
import type { LlmProviderType } from "./types";

export {
  MODEL_CATALOG,
  MODEL_CATALOG as PROVIDER_MODELS,
} from "./generated/model-catalog";

export const getDefaultModel = (type: LlmProviderType): string =>
  MODEL_CATALOG[type][0]?.id ?? "";
