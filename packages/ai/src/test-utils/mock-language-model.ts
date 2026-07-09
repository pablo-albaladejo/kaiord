import { MockLanguageModelV4 } from "ai/test";

/** Raw V4 usage with the given input/output token totals. */
const usage = (input: number, output: number) => ({
  inputTokens: { total: input },
  outputTokens: { total: output },
});

type Tokens = { input: number; output: number };

/** A scripted `doGenerate` result whose text content is the JSON of `obj`. */
export const jsonResult = (
  obj: unknown,
  tokens: Tokens = { input: 10, output: 5 }
) =>
  ({
    content: [{ type: "text" as const, text: JSON.stringify(obj) }],
    finishReason: { unified: "stop" as const, raw: "stop" },
    usage: usage(tokens.input, tokens.output),
    warnings: [],
    response: {
      id: "mock-response",
      timestamp: new Date(0),
      modelId: "mock-model",
    },
  }) as never;

/**
 * A `MockLanguageModelV4` that returns the given JSON objects in order, one per
 * `doGenerate` call. Drives the real runtime in the deterministic eval lane
 * without provider credentials. Inspect `model.doGenerateCalls` to assert on
 * the assembled prompt and forwarded file parts.
 */
export const mockModelReturning = (
  ...objects: unknown[]
): MockLanguageModelV4 =>
  new MockLanguageModelV4({
    modelId: "mock-model",
    provider: "mock-provider",
    doGenerate: objects.map((o) => jsonResult(o)),
  });
