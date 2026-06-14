/**
 * Builds a chat agent for one conversation: resolves the provider into an AI
 * SDK model, assembles the tool registry, and wires the streaming callback.
 * Async because `createLanguageModel` dynamically imports the provider SDK.
 */
import { type ChatAgent, type ChatTool, createChatAgent } from "@kaiord/ai";

import { buildChatSystemPrompt } from "../../application/chat/chat-system-prompt";
import { buildChatTools } from "../../application/chat/tools/build-chat-tools";
import type { ChatActionOps } from "../../application/chat/tools/chat-tool-deps";
import { createLanguageModel } from "../../lib/provider-factory";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";

export type BuiltChatAgent = { agent: ChatAgent; tools: ChatTool[] };

export type BuildChatAgentArgs = {
  persistence: PersistencePort;
  profileId: string;
  today: string;
  provider: LlmProviderConfig;
  actions: ChatActionOps;
  onTextDelta: (delta: string) => void;
};

export const buildChatAgent = async (
  args: BuildChatAgentArgs
): Promise<BuiltChatAgent> => {
  const tools = buildChatTools({
    persistence: args.persistence,
    profileId: args.profileId,
    today: args.today,
    actions: args.actions,
  });
  const model = await createLanguageModel(args.provider);
  const agent = createChatAgent({
    model,
    tools,
    system: buildChatSystemPrompt(),
    onTextDelta: args.onTextDelta,
  });
  return { agent, tools };
};
