import { MockLanguageModelV4 } from "ai/test";
import type { Cassette } from "./cassette-schema";
import { requestHashOf, toolsHashOf } from "./request-hashes";
import type { CallOptions } from "./request-hashes";

export type StaleHash = "prompt" | "tools" | "fixture" | "request";

type GenerateResult = Awaited<ReturnType<MockLanguageModelV4["doGenerate"]>>;

const toGenerateResult = (cassette: Cassette): GenerateResult => {
  const { structuredOutput, finishReason, usage } = cassette.response;
  return {
    content: [{ type: "text", text: JSON.stringify(structuredOutput) }],
    finishReason: { unified: finishReason, raw: finishReason },
    usage: {
      inputTokens: {
        total: usage.inputTokens,
        noCache: undefined,
        cacheRead: undefined,
        cacheWrite: undefined,
      },
      outputTokens: {
        total: usage.outputTokens,
        text: undefined,
        reasoning: undefined,
      },
    },
    warnings: [],
    response: {
      id: cassette.id,
      timestamp: new Date(cassette.recordedAt),
      modelId: cassette.servedModelId,
    },
  };
};

const staleHashesOf = (
  cassette: Cassette,
  options: CallOptions,
  modelId: string
): Array<StaleHash> => [
  ...(toolsHashOf(options) === cassette.toolsHash ? [] : ["tools" as const]),
  ...(requestHashOf(options, modelId) === cassette.requestHash
    ? []
    : ["request" as const]),
];

/**
 * Serves one recorded response to the real runtime. The request the runtime
 * actually assembles is hashed and compared with the recorded one first, so a
 * changed prompt, schema or model id is caught on the production path rather
 * than on a reconstruction of it. A mismatch is reported through `onStale`
 * and the call throws: a stale response is never handed back.
 */
export const createReplayModel = (
  cassette: Cassette,
  modelId: string,
  onStale: (hashes: Array<StaleHash>) => void
): MockLanguageModelV4 =>
  new MockLanguageModelV4({
    modelId,
    provider: "cassette-replay",
    doGenerate: async (options) => {
      const stale = staleHashesOf(cassette, options, modelId);
      if (stale.length > 0) {
        onStale(stale);
        throw new Error(`stale cassette ${cassette.id}: ${stale.join(", ")}`);
      }
      return toGenerateResult(cassette);
    },
  });
