/**
 * Persistence helpers for a chat turn. Kept in the application layer (no
 * React) so the turn hook stays thin and these are unit-testable. Ids and
 * timestamps are injected for deterministic tests; production passes the
 * real generators.
 */
import type { ChatTurnResult } from "@kaiord/ai";

import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderType } from "../../store/ai-store-types";
import { appendUsageEvent } from "../usage/append-usage-event";
import { newChatMessage } from "./chat-message-mapper";

export type IdGen = { newId: () => string; now: () => string };

const defaultGen: IdGen = {
  newId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

export const appendUserMessage = (
  persistence: PersistencePort,
  profileId: string,
  conversationId: string,
  content: string,
  gen: IdGen = defaultGen
): Promise<void> =>
  persistence.chatMessages.append(
    newChatMessage({
      id: gen.newId(),
      profileId,
      conversationId,
      role: "user",
      content,
      createdAt: gen.now(),
    })
  );

export const appendToolEvent = (
  persistence: PersistencePort,
  profileId: string,
  conversationId: string,
  toolName: string,
  ok: boolean,
  toolResult?: unknown,
  gen: IdGen = defaultGen
): Promise<void> =>
  persistence.chatMessages.append(
    newChatMessage({
      id: gen.newId(),
      profileId,
      conversationId,
      role: "tool",
      content: ok ? `Ran ${toolName}.` : `${toolName} failed.`,
      toolName,
      toolResult: ok ? toolResult : undefined,
      createdAt: gen.now(),
    })
  );

export const appendAssistantTurn = async (
  persistence: PersistencePort,
  profileId: string,
  conversationId: string,
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
      conversationId,
      role: "assistant",
      content: text,
      createdAt: gen.now(),
      usage: result.usage,
    })
  );
  if (result.usage)
    await appendUsageEvent(persistence, {
      purpose: "chat",
      providerType,
      ...result.usage,
    }).catch(() => {
      // Best-effort: the event log is authoritative, but a failed usage write
      // must never fail a turn whose messages already committed.
    });
};
