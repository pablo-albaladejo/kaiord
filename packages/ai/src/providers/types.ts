/**
 * Provider, credential, binding, and resolution types shared by every AI
 * feature. `AiModelPurpose` is an open union so new purposes need no change
 * here. Concrete provider records (e.g. a Dexie-backed config carrying an API
 * key and label) satisfy `ResolvableProvider` structurally.
 */

export type LlmProviderType = "anthropic" | "openai" | "google";

export type ProviderCredential = {
  type: LlmProviderType;
  apiKey: string;
};

export type AiModelPurpose =
  "default" | "chat" | "workout_generation" | "lab_extraction" | (string & {});

export type AiModelBinding = {
  profileId: string;
  purpose: AiModelPurpose;
  providerId: string;
  modelId: string;
  updatedAt: string;
};

/** Minimal provider shape the resolver reads. */
export type ResolvableProvider = {
  id: string;
  type: LlmProviderType;
  isDefault: boolean;
  model?: string;
};

export type ResolvedModel<P extends ResolvableProvider = ResolvableProvider> = {
  provider: P;
  modelId: string;
};

export type ModelOption = { id: string; label: string };
