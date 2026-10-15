/**
 * setConversationModel / clearConversationModel — application use cases.
 *
 * Stamp or clear the per-conversation model override (`providerId`/`modelId`)
 * and advance `updatedAt` so the change converges last-write-wins across
 * devices. A cleared conversation follows the chat default again. A blank
 * model id is rejected: it would run nothing. The read is profile-scoped, so
 * a foreign/absent id is a no-op.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";

type Rewrite = (row: ChatConversationRecord) => ChatConversationRecord;

const rewrite = (
  port: PersistencePort,
  profileId: string,
  conversationId: string,
  apply: Rewrite
): Promise<void> =>
  port.transaction(async () => {
    const existing = await port.chatConversations.get(
      profileId,
      conversationId
    );
    if (existing) await port.chatConversations.put(apply(existing));
  });

export const setConversationModel = async (
  port: PersistencePort,
  profileId: string,
  conversationId: string,
  providerId: string,
  modelId: string,
  now: () => Date = () => new Date()
): Promise<void> => {
  if (!modelId.trim()) throw new Error("A chat model id cannot be blank");
  await rewrite(port, profileId, conversationId, (row) => ({
    ...row,
    providerId,
    modelId,
    updatedAt: now().toISOString(),
  }));
};

export const clearConversationModel = (
  port: PersistencePort,
  profileId: string,
  conversationId: string,
  now: () => Date = () => new Date()
): Promise<void> =>
  rewrite(port, profileId, conversationId, (row) => {
    const cleared = { ...row, updatedAt: now().toISOString() };
    delete cleared.providerId;
    delete cleared.modelId;
    return cleared;
  });
