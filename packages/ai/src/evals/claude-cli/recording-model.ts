import type {
  LanguageModelV4,
  V4CallOptions,
  V4GenerateResult,
} from "./language-model-types";

export type RecordedCall = { options: V4CallOptions; result: V4GenerateResult };

export type RecordingModel = {
  model: LanguageModelV4;
  calls: () => ReadonlyArray<RecordedCall>;
  /** Every `doGenerate` attempt, counted before the inner model runs. */
  attempts: () => number;
};

/**
 * Wraps a model and keeps every successful `doGenerate` call with the exact
 * options the runtime sent, the same options replay hashes. Attempts are
 * counted apart, so a call that rejected still counts.
 */
export const createRecordingModel = (
  inner: LanguageModelV4
): RecordingModel => {
  const calls: Array<RecordedCall> = [];
  let attempts = 0;
  const model: LanguageModelV4 = {
    specificationVersion: "v4",
    provider: inner.provider,
    modelId: inner.modelId,
    supportedUrls: inner.supportedUrls,
    doGenerate: async (options) => {
      attempts++;
      const result = await inner.doGenerate(options);
      calls.push({ options, result });
      return result;
    },
    doStream: (options) => inner.doStream(options),
  };
  return { model, calls: () => calls, attempts: () => attempts };
};
