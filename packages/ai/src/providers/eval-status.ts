import type { LlmProviderType } from "./types";

/**
 * The models with a passing eval result in the store the repo keeps: the
 * committed cassettes (`evals/cassettes/committed/`), replayed green over
 * every benchmark. Any other model, a Provider's default included, is not
 * evaluated. A test ties this list to that store, so a model is added here
 * only with its committed results.
 */
export const EVALUATED_MODELS: Readonly<
  Record<LlmProviderType, ReadonlyArray<string>>
> = {
  anthropic: ["claude-sonnet-5"],
  openai: [],
  google: [],
};

/** True only when the stored eval results prove `modelId` passed. */
export const isEvaluatedModel = (
  type: LlmProviderType,
  modelId: string
): boolean => EVALUATED_MODELS[type].includes(modelId);
