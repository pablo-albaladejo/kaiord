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

/**
 * Persists the assistant reply. A stopped or timed-out reply keeps only what
 * streamed in `content` and records why in `stopReason`; the transcript
 * localizes it and the model replay adds the marker. `step_limit` still
 * appends its legacy English marker to `content`: rows already stored carry
 * it that way, so changing it would split the history in two shapes.
 *
 * Usage is NOT logged here: the agent's `chat_turn_finished` telemetry event
 * feeds the usage sink for every turn, including paused and stopped ones that
 * never reach this writer.
 */
export const appendAssistantTurn = async (
  persistence: PersistencePort,
  profileId: string,
  conversationId: string,
  result: Extract<ChatTurnResult, { text: string }>,
  gen: IdGen = defaultGen
): Promise<void> => {
  await persistence.chatMessages.append(
    newChatMessage({
      id: gen.newId(),
      profileId,
      conversationId,
      role: "assistant",
      content:
        result.status === "step_limit"
          ? `${result.text}\n\n(Stopped: reached the step limit.)`
          : result.text,
      createdAt: gen.now(),
      usage: result.usage,
      stopReason:
        result.status === "aborted" || result.status === "timeout"
          ? result.status
          : undefined,
    })
  );
};
