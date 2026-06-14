/**
 * Persistence helpers for a chat turn. Kept in the application layer (no
 * React) so the turn hook stays thin and these are unit-testable. Ids and
 * timestamps are injected for deterministic tests; production passes the
 * real generators.
 */
import type { ChatTurnResult, ChatUsage } from "@kaiord/ai";

import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderType } from "../../store/ai-store-types";
import { newChatMessage } from "./chat-message-mapper";
import { recordChatUsage } from "./record-chat-usage";

export type IdGen = { newId: () => string; now: () => string };

const defaultGen: IdGen = {
  newId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

export const appendUserMessage = (
  persistence: PersistencePort,
  profileId: string,
  content: string,
  gen: IdGen = defaultGen
): Promise<void> =>
  persistence.chatMessages.append(
    newChatMessage({
      id: gen.newId(),
      profileId,
      role: "user",
      content,
      createdAt: gen.now(),
    })
  );

export const appendToolEvent = (
  persistence: PersistencePort,
  profileId: string,
  toolName: string,
  ok: boolean,
  gen: IdGen = defaultGen
): Promise<void> =>
  persistence.chatMessages.append(
    newChatMessage({
      id: gen.newId(),
      profileId,
      role: "tool",
      content: ok ? `Ran ${toolName}.` : `${toolName} failed.`,
      toolName,
      createdAt: gen.now(),
    })
  );

export const appendAssistantTurn = async (
  persistence: PersistencePort,
  profileId: string,
  result: Extract<ChatTurnResult, { text: string }>,
  providerType: LlmProviderType,
  gen: IdGen = defaultGen
): Promise<void> => {
  const text =
    result.status === "step_limit"
      ? `${result.text}\n\n(Stopped: reached the step limit.)`
      : result.text;
  await persistence.chatMessages.append(
    newChatMessage({
      id: gen.newId(),
      profileId,
      role: "assistant",
      content: text,
      createdAt: gen.now(),
      usage: result.usage,
    })
  );
  await recordUsage(persistence, providerType, result.usage);
};

const recordUsage = (
  persistence: PersistencePort,
  providerType: LlmProviderType,
  usage: ChatUsage | undefined
): Promise<void> =>
  usage
    ? recordChatUsage(persistence, {
        providerType,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      })
    : Promise.resolve();
