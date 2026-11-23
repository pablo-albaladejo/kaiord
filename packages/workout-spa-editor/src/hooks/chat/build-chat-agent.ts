/**
 * Builds a chat agent for one conversation: resolves the provider into an AI
 * SDK model, assembles the tool registry, and wires the streaming callback
 * and the turn's Trace, which passes each model call on to the usage sink
 * (chat cost lands in the same `usageEvents` log as the generate agents).
 * Async because `createLanguageModel` dynamically imports the provider SDK.
 */
import { type ChatAgent, type ChatTool, createChatAgent } from "@kaiord/ai";
import { buildChatSystemPrompt, CHAT_PROMPT_VERSION } from "@kaiord/ai/prompts";
import {
  createLanguageModel,
  type ProviderCredential,
} from "@kaiord/ai/providers";

import { createDexieUsageTelemetrySink } from "../../adapters/telemetry/dexie-usage-telemetry-sink";
import { buildChatTools } from "../../application/chat/tools/build-chat-tools";
import type { ChatActionOps } from "../../application/chat/tools/chat-tool-deps";
import type { DataHubMatrixSignals } from "../../application/data-hub/build-data-hub-matrix";
import { traceReadTools } from "../../application/trace/trace-read-tools";
import type { TraceRun } from "../../application/trace/trace-run";
import type { PersistencePort } from "../../ports/persistence-port";
import { logger } from "../../utils/logger";

export type BuiltChatAgent = { agent: ChatAgent; tools: ChatTool[] };

export type BuildChatAgentArgs = {
  persistence: PersistencePort;
  /** The turn's Trace: its model calls and read Tools report there. */
  trace: TraceRun;
  profileId: string;
  today: string;
  provider: ProviderCredential;
  modelId: string;
  actions: ChatActionOps;
  /** The athlete lets this Provider read their health data. */
  healthShared: boolean;
  getMatrixSignals: () => Promise<DataHubMatrixSignals>;
  onTextDelta: (delta: string) => void;
};

export const buildChatAgent = async (
  args: BuildChatAgentArgs
): Promise<BuiltChatAgent> => {
  const built = buildChatTools({
    persistence: args.persistence,
    profileId: args.profileId,
    today: args.today,
    actions: args.actions,
    healthShared: args.healthShared,
    getMatrixSignals: args.getMatrixSignals,
  });
  const tools = traceReadTools(built, args.trace);
  const model = await createLanguageModel(args.provider, args.modelId, {
    browser: true,
  });
  const agent = createChatAgent({
    model,
    tools,
    system: buildChatSystemPrompt(),
    promptVersion: CHAT_PROMPT_VERSION,
    telemetry: args.trace.sink(
      createDexieUsageTelemetrySink(args.persistence, logger)
    ),
    onTextDelta: args.onTextDelta,
  });
  return { agent, tools };
};
