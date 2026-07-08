/**
 * Per-profile AI model binding: the provider + model a given AI purpose uses.
 * Owned by `@kaiord/ai/providers`; re-exported here for the SPA's persistence
 * and use-case layers. `default` is the fallback for any purpose without an
 * override.
 */
export type { AiModelBinding, AiModelPurpose } from "@kaiord/ai/providers";
