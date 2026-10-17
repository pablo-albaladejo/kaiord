import { generateText, Output, streamText } from "ai";
import type { LanguageModel } from "ai";
import type { AgentDefinition, GenerateAgentInput } from "./definition-types";
import type { AiUsage } from "../observability/telemetry-types";
import type { GenerateProgressPhase } from "./progress";
import { buildUserMessage } from "./build-user-message";

const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

export type GenerateOutcome<TOutput> = { output: TOutput; usage?: AiUsage };

export type CallModelArgs<TOutput> = {
  model: LanguageModel;
  system: string;
  input: GenerateAgentInput;
  definition: AgentDefinition<TOutput>;
  signal?: AbortSignal;
};

export type ReportPhase = (
  phase: GenerateProgressPhase,
  items?: number
) => void;

const toUsage = (raw: {
  inputTokens?: number;
  outputTokens?: number;
}): AiUsage => ({
  promptTokens: raw?.inputTokens ?? 0,
  completionTokens: raw?.outputTokens ?? 0,
});

// `validate`, when present, owns validation and receives the RAW model output
// (so an agent whose wire schema is permissive can validate against a stricter
// domain schema). Otherwise the wire `outputSchema` is the gate.
const validateOutput = <TOutput>(
  definition: AgentDefinition<TOutput>,
  raw: unknown
): TOutput =>
  definition.validate
    ? definition.validate(raw)
    : (definition.outputSchema.parse(raw) as TOutput);

const callSettings = <TOutput>(
  args: CallModelArgs<TOutput>,
  feedback?: string
) => ({
  model: args.model,
  output: Output.object({ schema: args.definition.outputSchema }),
  system: args.system,
  messages: [buildUserMessage(args.input, feedback)],
  maxOutputTokens: args.definition.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
  temperature: args.definition.temperature ?? 0,
  maxRetries: 0,
  abortSignal: args.signal,
});

export const callModel = async <TOutput>(
  args: CallModelArgs<TOutput>,
  feedback?: string
): Promise<GenerateOutcome<TOutput>> => {
  const result = await generateText(callSettings(args, feedback));
  if (!result.output) throw new Error("No structured output generated");
  return {
    output: validateOutput(args.definition, result.output),
    usage: toUsage(result.usage),
  };
};

/**
 * Streaming twin of `callModel`: same request, same validation, plus a phase
 * report per partial output. A provider failure arrives as a stream `error`
 * part handed to `onError`, not a throw, and the result promises then reject
 * with a generic error that drops the `statusCode`; the first stream error is
 * captured and rethrown so retry classification sees the real failure (the
 * same seam as `chat/run-turn.ts`). Capturing it also replaces the SDK's
 * default `onError`, which logs the request body.
 */
export const streamModel = async <TOutput>(
  args: CallModelArgs<TOutput>,
  feedback: string | undefined,
  report: ReportPhase
): Promise<GenerateOutcome<TOutput>> => {
  let streamError: unknown;
  const result = streamText({
    ...callSettings(args, feedback),
    onError: ({ error }) => {
      streamError ??= error;
    },
  });
  const settled = async () => {
    for await (const partial of result.partialOutputStream) {
      report("generating", args.definition.countItems?.(partial));
    }
    // A failed stream also ends the loop; it must not claim to validate.
    if (streamError === undefined) report("validating");
    return Promise.all([result.output, result.usage]);
  };
  const [raw, usage] = await settled().catch((e: unknown) => {
    throw streamError ?? e;
  });
  if (streamError !== undefined) throw streamError;
  return {
    output: validateOutput(args.definition, raw),
    usage: toUsage(usage),
  };
};
