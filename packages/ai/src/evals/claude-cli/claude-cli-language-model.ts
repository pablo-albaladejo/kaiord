import type { ClaudeRequest } from "./clean-context-args";
import { toClaudeRequest, unsupported } from "./claude-request";
import { CLI_METADATA_KEY } from "./language-model-types";
import type {
  LanguageModelV4,
  V4GenerateResult,
  V4Warning,
} from "./language-model-types";
import type { CliRun } from "./stream-messages";

/** Real gaps with the production call, declared on every response. */
export const PARITY_GAPS: Array<V4Warning> = [
  {
    type: "unsupported",
    feature: "temperature",
    details: "claude -p does not honour temperature",
  },
  {
    type: "unsupported",
    feature: "maxOutputTokens",
    details: "claude -p does not honour the output-token limit",
  },
  {
    type: "compatibility",
    feature: "system prompt",
    details: "the CLI injects a hidden system overhead",
  },
];

const toResult = (run: CliRun, modelId: string): V4GenerateResult => {
  const { result, init } = run;
  const servedModels = Object.keys(result.modelUsage);
  return {
    content:
      result.structuredOutput === undefined
        ? []
        : [{ type: "text", text: JSON.stringify(result.structuredOutput) }],
    finishReason: {
      unified: result.stopReason === "max_tokens" ? "length" : "stop",
      raw: result.stopReason,
    },
    usage: {
      inputTokens: {
        total:
          result.usage.input + result.usage.cacheRead + result.usage.cacheWrite,
        noCache: result.usage.input,
        cacheRead: result.usage.cacheRead,
        cacheWrite: result.usage.cacheWrite,
      },
      outputTokens: {
        total: result.usage.output,
        text: undefined,
        reasoning: undefined,
      },
    },
    warnings: PARITY_GAPS,
    providerMetadata: {
      [CLI_METADATA_KEY]: {
        cliVersion: init.cliVersion,
        servedModels,
        apiEquivalentCostUsd: result.apiEquivalentCostUsd,
      },
    },
    response: {
      modelId: servedModels.length === 1 ? servedModels[0] : modelId,
    },
  };
};

/**
 * `LanguageModelV4` over `claude -p --json-schema`: the CLI's
 * `structured_output` comes back as one text part, so `Output.object` and the
 * runtime's validation and retry loop run unchanged above it. One process per
 * call, retries included.
 */
export const createClaudeCliLanguageModel = (deps: {
  modelId: string;
  call: (request: ClaudeRequest) => Promise<CliRun>;
}): LanguageModelV4 => ({
  specificationVersion: "v4",
  provider: "claude-cli",
  modelId: deps.modelId,
  supportedUrls: {},
  doGenerate: async (options) =>
    toResult(
      await deps.call(toClaudeRequest(options, deps.modelId)),
      deps.modelId
    ),
  doStream: async () => {
    throw unsupported("streaming");
  },
});
