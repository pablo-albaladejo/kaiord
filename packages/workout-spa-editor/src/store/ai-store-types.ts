import type { LlmProviderType } from "@kaiord/ai/providers";

export type { LlmProviderType } from "@kaiord/ai/providers";

export type LlmProviderConfig = {
  id: string;
  type: LlmProviderType;
  apiKey: string;
  // Deprecated: model now lives in aiModelBindings; kept one release for migration.
  model?: string;
  label: string;
  isDefault: boolean;
  // Epoch ms stamped at addProvider; immutable thereafter. Drives the
  // canonical insertion order surfaced by getAll(), so ModelSelector
  // and SettingsPanel listings are deterministic across reloads.
  createdAt: number;
};

export type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" };
