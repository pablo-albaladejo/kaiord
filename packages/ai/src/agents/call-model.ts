import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";
import type { AgentDefinition, GenerateAgentInput } from "./definition-types";
import type { AiUsage } from "../observability/telemetry-types";
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

export const toUsage = (raw: {
  inputTokens?: number;
  outputTokens?: number;
}): AiUsage => ({
  promptTokens: raw?.inputTokens ?? 0,
  completionTokens: raw?.outputTokens ?? 0,
});

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
  const result = await generateText(callSettings(args, feedback)).catch(
    (error: unknown) => {
      throw toOutputError(error);
    }
  );
  throwIfTruncated(result.finishReason);
  return {
    output: validateOutput(args.definition, result.output),
    usage: toUsage(result.usage),
  };
};
