import type { ModelMessage } from "ai";
import { appendToolResult } from "./append-tool-result";
import { actionToolNames, buildSdkTools } from "./build-sdk-tools";
import type {
  ChatAgent,
  ChatAgentConfig,
  ChatTurnOptions,
  ChatTurnResult,
  ToolResolution,
} from "./chat-types";
import { DEFAULT_MAX_STEPS, DEFAULT_TURN_IDLE_TIMEOUT_MS } from "./chat-types";
import { emitChatTurn } from "./chat-turn-telemetry";
import { classifyTurn } from "./classify-turn";
import { runTurn, type RawTurn } from "./run-turn";
import { turnMetricsOf } from "./turn-stats";

/**
 * Creates a provider-agnostic chat agent that runs a multi-step tool-calling
 * loop per turn. The consumer supplies the `LanguageModel` and a tool
 * registry; read tools run automatically, action tools pause for confirmation
 * and continue via {@link ChatAgent.resume}. Each turn is bounded by an
 * inactivity watchdog and reports exactly one `chat_turn_finished` event:
 * running and classifying share one `try`, so a throw from either is the
 * `error` event (with the finished steps' metrics) and nothing else.
 */
export const createChatAgent = (config: ChatAgentConfig): ChatAgent => {
  const maxSteps = config.maxSteps ?? DEFAULT_MAX_STEPS;
  const idleTimeoutMs =
    config.turnIdleTimeoutMs ?? DEFAULT_TURN_IDLE_TIMEOUT_MS;
  const sdkTools = buildSdkTools(config.tools);
  const actions = actionToolNames(config.tools);

  const turn = async (
    messages: ModelMessage[],
    options?: ChatTurnOptions
  ): Promise<ChatTurnResult> => {
    config.logger?.info("Chat turn started", { messages: messages.length });
    const trace = {
      traceId: crypto.randomUUID(),
      startedAt: Date.now(),
      promptVersion: config.promptVersion ?? "unknown",
      model: config.model,
    };
    let raw: RawTurn;
    let result: ChatTurnResult;
    try {
      raw = await runTurn({
        model: config.model,
        system: config.system,
        messages,
        tools: sdkTools,
        maxSteps,
        onTextDelta: config.onTextDelta,
        abortSignal: options?.signal,
        idleTimeoutMs,
      });
      result = classifyTurn(messages, raw, actions);
    } catch (error) {
      emitChatTurn(config.telemetry, trace, "error", turnMetricsOf(error));
      throw error;
    }
    emitChatTurn(config.telemetry, trace, result.status, raw);
    config.logger?.info("Chat turn settled", { status: result.status });
    return result;
  };

  return {
    sendTurn: (messages, options) => turn(messages, options),
    resume: (messages, resolution: ToolResolution, options) =>
      turn(appendToolResult(messages, resolution), options),
  };
};
