/**
 * deleteConversation — application use case.
 *
 * Removes one conversation: its messages and the conversation row, leaving
 * every other conversation and profile intact. Records a `[chatMessages+id]`
 * tombstone per deleted message plus one `[chatConversations+id]` tombstone so
 * the delete survives a later cloud-sync merge (no resurrection from a stale
 * snapshot). Runs in one `port.transaction`.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export const deleteConversation = async (
  port: PersistencePort,
  profileId: string,
  conversationId: string,
  now: () => Date = () => new Date()
): Promise<void> => {
  await port.transaction(async () => {
    const existing = await port.chatConversations.get(
      profileId,
      conversationId
    );
    if (!existing) return;
    const messages = await port.chatMessages.listByConversation(
      profileId,
      conversationId
    );
    await port.chatMessages.deleteByConversation(conversationId);
    await port.chatConversations.delete(conversationId);
    const deletedAt = now().toISOString();
    for (const message of messages) {
      await port.tombstones.put({
        table: "chatMessages",
        id: message.id,
        deletedAt,
        profileId,
      });
    }
    await port.tombstones.put({
      table: "chatConversations",
      id: conversationId,
      deletedAt,
      profileId,
    });
  });
};
