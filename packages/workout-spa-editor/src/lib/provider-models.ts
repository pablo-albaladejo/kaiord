import type { LlmProviderType } from "../store/ai-store-types";

export type ModelOption = {
  id: string;
  label: string;
};

export const PROVIDER_MODELS: Record<LlmProviderType, Array<ModelOption>> = {
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  google: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  ],
};

export const getDefaultModel = (type: LlmProviderType): string =>
  PROVIDER_MODELS[type][0].id;
