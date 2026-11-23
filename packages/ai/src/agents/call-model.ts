import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";
import type { AgentDefinition, GenerateAgentInput } from "./definition-types";
import type { AiUsage } from "../observability/telemetry-types";
import { sdkErrorUsage, toUsage, withUsage } from "./attempt-usage";
import { cutUsage, requestChars } from "./cut-request";
import type { GenerateProgressPhase } from "./progress";
import { buildUserMessage } from "./build-user-message";
import {
  AiOutputInvalidError,
  throwIfTruncated,
  toOutputError,
} from "./output-errors";

const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

export type GenerateOutcome<TOutput> = { output: TOutput; usage?: AiUsage };

export type CallModelArgs<TOutput> = {
  model: LanguageModel;
  system: string;
  input: GenerateAgentInput;
  definition: AgentDefinition<TOutput>;
  signal?: AbortSignal;
  /** Overrides the definition's budget, e.g. raised after a truncation. */
  maxOutputTokens?: number;
};

export type ReportPhase = (
  phase: GenerateProgressPhase,
  items?: number,
  partial?: unknown
) => void;

// `validate`, when present, owns validation and receives the RAW model output
// (so an agent whose wire schema is permissive can validate against a stricter
// domain schema). Otherwise the wire `outputSchema` is the gate.
export const validateOutput = <TOutput>(
  definition: AgentDefinition<TOutput>,
  raw: unknown
): TOutput => {
  if (!raw) throw new AiOutputInvalidError("No structured output generated");
  try {
    return definition.validate
      ? definition.validate(raw)
      : (definition.outputSchema.parse(raw) as TOutput);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AiOutputInvalidError(message, error);
  }
};

export const outputBudgetOf = <TOutput>(args: CallModelArgs<TOutput>) =>
  args.maxOutputTokens ??
  args.definition.maxOutputTokens ??
  DEFAULT_MAX_OUTPUT_TOKENS;

export const callSettings = <TOutput>(
  args: CallModelArgs<TOutput>,
  feedback?: string
) => ({
  model: args.model,
  output: Output.object({ schema: args.definition.outputSchema }),
  system: args.system,
  messages: [buildUserMessage(args.input, feedback)],
  maxOutputTokens: outputBudgetOf(args),
  temperature: args.definition.temperature ?? 0,
  maxRetries: 0,
  abortSignal: args.signal,
});

export const callModel = async <TOutput>(
  args: CallModelArgs<TOutput>,
  feedback?: string
): Promise<GenerateOutcome<TOutput>> => {
  const settings = callSettings(args, feedback);
  const result = await generateText(settings).catch((error: unknown) => {
    const reported = sdkErrorUsage(error);
    // A stop leaves no usage: the request's text is what it was billed for.
    const cut = !reported && args.signal?.aborted;
    const sent = requestChars(settings.system, settings.messages);
    throw withUsage(
      toOutputError(error),
      cut ? cutUsage(sent, 0) : reported,
      Boolean(cut)
    );
  });
  const usage = toUsage(result.usage);
  try {
    throwIfTruncated(result.finishReason);
    return { output: validateOutput(args.definition, result.output), usage };
  } catch (error) {
    throw withUsage(error, usage);
  }
};
