/**
 * ensureConversationForTurn — application use case.
 *
 * Lazily persists a draft conversation on its first message (title derived
 * from that message per D8, active model stamped per D9), and otherwise
 * advances the existing row's `updatedAt` so the conversation list re-sorts
 * to the top. Runs in one `port.transaction` so a mid-turn failure rolls back
 * cleanly.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import { deriveConversationTitle } from "./derive-conversation-title";

export type ConversationModel = { providerId: string; modelId: string };

export type EnsureConversationArgs = {
  profileId: string;
  conversationId: string;
  firstMessageText: string;
  model?: ConversationModel;
};

export const ensureConversationForTurn = async (
  port: PersistencePort,
  args: EnsureConversationArgs,
  now: () => Date = () => new Date()
): Promise<void> => {
  const { profileId, conversationId, firstMessageText, model } = args;
  await port.transaction(async () => {
    const existing = await port.chatConversations.get(
      profileId,
      conversationId
    );
    const timestamp = now().toISOString();
    if (existing) {
      await port.chatConversations.put({ ...existing, updatedAt: timestamp });
      return;
    }
    await port.chatConversations.put({
      id: conversationId,
      profileId,
      title: deriveConversationTitle(firstMessageText),
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(model
        ? { providerId: model.providerId, modelId: model.modelId }
        : {}),
    });
  });
};
