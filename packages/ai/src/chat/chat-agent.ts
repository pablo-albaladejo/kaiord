import type { ModelMessage } from "ai";
import { appendToolResult } from "./append-tool-result";
import { actionToolNames, buildSdkTools } from "./build-sdk-tools";
import type {
  ChatAgent,
  ChatAgentConfig,
  ChatTurnResult,
  ToolResolution,
} from "./chat-types";
import { DEFAULT_MAX_STEPS } from "./chat-types";
import { classifyTurn } from "./classify-turn";
import { runTurn } from "./run-turn";

/**
 * Creates a provider-agnostic chat agent that runs a multi-step tool-calling
 * loop per turn. The consumer supplies the `LanguageModel` and a tool
 * registry; read tools run automatically, action tools pause for confirmation
 * and continue via {@link ChatAgent.resume}.
 */
export const createChatAgent = (config: ChatAgentConfig): ChatAgent => {
  const maxSteps = config.maxSteps ?? DEFAULT_MAX_STEPS;
  const sdkTools = buildSdkTools(config.tools);
  const actions = actionToolNames(config.tools);

  const turn = async (messages: ModelMessage[]): Promise<ChatTurnResult> => {
    config.logger?.info("Chat turn started", { messages: messages.length });
    const raw = await runTurn({
      model: config.model,
      system: config.system,
      messages,
      tools: sdkTools,
      maxSteps,
      onTextDelta: config.onTextDelta,
    });
    const result = classifyTurn(messages, raw, actions);
    config.logger?.info("Chat turn settled", { status: result.status });
    return result;
  };

  return {
    sendTurn: (messages) => turn(messages),
    resume: (messages, resolution: ToolResolution) =>
      turn(appendToolResult(messages, resolution)),
  };
};
