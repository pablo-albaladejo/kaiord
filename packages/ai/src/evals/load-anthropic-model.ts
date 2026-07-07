import type { LanguageModel } from "ai";

export type LoadedModel = {
  model: LanguageModel;
  provider: string;
  modelName: string;
};

/**
 * Shared model loader for the eval CLIs. Requires `ANTHROPIC_API_KEY`;
 * override the model with `EVAL_MODEL`. Evals are manual-trigger only
 * (see AGENTS.md) — this never runs in the standard test suite.
 */
export const loadAnthropicModel = async (): Promise<LoadedModel> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Set ANTHROPIC_API_KEY env variable");

  const { createAnthropic } = await import("@ai-sdk/anthropic");
  const modelName = process.env.EVAL_MODEL ?? "claude-sonnet-4-5-20250929";
  const provider = createAnthropic({ apiKey });
  return { model: provider(modelName), provider: "anthropic", modelName };
};
