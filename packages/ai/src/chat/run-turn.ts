import { streamText, stepCountIs } from "ai";
import type { LanguageModel, ModelMessage, ToolSet } from "ai";
import type { ChatUsage } from "./chat-types";

/** Normalized result of a single AI SDK turn, decoupled from the SDK shape. */
export type RawTurn = {
  text: string;
  toolCalls: Array<{ toolName: string; toolCallId: string; input: unknown }>;
  finishReason: string;
  usage?: ChatUsage;
  /** Response messages produced this turn (assistant text + tool parts). */
  messages: ModelMessage[];
};

export type RunTurnParams = {
  model: LanguageModel;
  system?: string;
  messages: ModelMessage[];
  tools: ToolSet;
  maxSteps: number;
  onTextDelta?: (delta: string) => void;
};

/**
 * Single seam over the AI SDK. Runs the multi-step tool loop (read tools
 * auto-execute; an action tool with no `execute` halts the loop), streams
 * text deltas to `onTextDelta`, then resolves the normalized turn.
 */
export const runTurn = async (params: RunTurnParams): Promise<RawTurn> => {
  const result = streamText({
    model: params.model,
    system: params.system,
    messages: params.messages,
    tools: params.tools,
    stopWhen: stepCountIs(params.maxSteps),
    // We own retries at the call-site; disable the SDK's internal layer so a
    // retryable error costs one HTTP call per turn, not N.
    maxRetries: 0,
  });

  for await (const delta of result.textStream) params.onTextDelta?.(delta);

  const [text, toolCalls, finishReason, usage, response] = await Promise.all([
    result.text,
    result.toolCalls,
    result.finishReason,
    result.usage,
    result.response,
  ]);

  return {
    text,
    toolCalls: toolCalls.map((c) => ({
      toolName: c.toolName,
      toolCallId: c.toolCallId,
      input: c.input,
    })),
    finishReason,
    usage: usage
      ? {
          promptTokens: usage.inputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
        }
      : undefined,
    messages: response.messages,
  };
};
