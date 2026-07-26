import type { LanguageModel } from "ai";
import { createLanguageModel } from "../providers/create-language-model";
import { getDefaultModel } from "../providers/provider-models";
import type { LlmProviderType } from "../providers/types";

export type LoadedModel = {
  model: LanguageModel;
  provider: string;
  modelName: string;
};

const API_KEY_ENV: Record<LlmProviderType, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
};

const DEFAULT_MODEL: Partial<Record<LlmProviderType, string>> = {
  anthropic: "claude-sonnet-4-5-20250929",
};

/**
 * Shared model loader for the eval CLIs. Reads `EVAL_PROVIDER`
 * (default `anthropic`) and `EVAL_MODEL`, building the model through
 * `@kaiord/ai/providers` with the matching provider API key. Manual-trigger
 * only — never runs in the standard test suite.
 */
export const loadEvalModel = async (): Promise<LoadedModel> => {
  const provider = (process.env.EVAL_PROVIDER ??
    "anthropic") as LlmProviderType;
  const envKey = API_KEY_ENV[provider];
  const apiKey = envKey ? process.env[envKey] : undefined;
  if (!apiKey) throw new Error(`Set ${envKey ?? "the provider"} env variable`);

  const modelName =
    process.env.EVAL_MODEL ??
    DEFAULT_MODEL[provider] ??
    getDefaultModel(provider);
  const model = await createLanguageModel(
    { type: provider, apiKey },
    modelName
  );
  return { model, provider, modelName };
};
