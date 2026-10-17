/**
 * Persistence helpers for a chat turn. Kept in the application layer (no
 * React) so the turn hook stays thin and these are unit-testable. Ids and
 * timestamps are injected for deterministic tests; production passes the
 * real generators.
 */
import type { ChatTurnResult } from "@kaiord/ai";

import type { PersistencePort } from "../../ports/persistence-port";
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

/** Marks a turn that ended early, so the transcript and the next turn's
 * history both say the reply was cut short rather than finished. */
const STOP_MARKERS: Partial<Record<ChatTurnResult["status"], string>> = {
  step_limit: "(Stopped: reached the step limit.)",
  aborted: "(Stopped by the user.)",
  timeout: "(Stopped: the response took too long.)",
};

/**
 * Persists the assistant reply. Usage is NOT logged here: the agent's
 * `chat_turn_finished` telemetry event feeds the usage sink for every turn,
 * including paused and stopped ones that never reach this writer.
 */
export const appendAssistantTurn = async (
  persistence: PersistencePort,
  profileId: string,
  conversationId: string,
  result: Extract<ChatTurnResult, { text: string }>,
  gen: IdGen = defaultGen
): Promise<void> => {
  const marker = STOP_MARKERS[result.status];
  const text = marker
    ? [result.text, marker].filter(Boolean).join("\n\n")
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
};
