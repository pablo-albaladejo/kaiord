/**
 * Builds a chat agent for one conversation: resolves the provider into an AI
 * SDK model, assembles the tool registry, and wires the streaming callback.
 * Async because `createLanguageModel` dynamically imports the provider SDK.
 */
import { type ChatAgent, type ChatTool, createChatAgent } from "@kaiord/ai";

import { buildChatSystemPrompt } from "../../application/chat/chat-system-prompt";
import { buildChatTools } from "../../application/chat/tools/build-chat-tools";
import type { ChatActionOps } from "../../application/chat/tools/chat-tool-deps";
import type { DataHubMatrixSignals } from "../../application/data-hub/build-data-hub-matrix";
import {
  createLanguageModel,
  type ProviderCredential,
} from "../../lib/provider-factory";
import type { PersistencePort } from "../../ports/persistence-port";

export type BuiltChatAgent = { agent: ChatAgent; tools: ChatTool[] };

export type BuildChatAgentArgs = {
  persistence: PersistencePort;
  profileId: string;
  today: string;
  provider: ProviderCredential;
  modelId: string;
  actions: ChatActionOps;
  getMatrixSignals: () => Promise<DataHubMatrixSignals>;
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
    getMatrixSignals: args.getMatrixSignals,
  });
  const model = await createLanguageModel(args.provider, args.modelId);
  const agent = createChatAgent({
    model,
    tools,
    system: buildChatSystemPrompt(),
    onTextDelta: args.onTextDelta,
  });
  return { agent, tools };
};
