/**
 * setConversationModel — application use case.
 *
 * Stamps the per-conversation model override (`providerId`/`modelId`) and
 * advances `updatedAt` so the change converges last-write-wins across devices.
 * The read is profile-scoped, so a foreign/absent id is a no-op.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export const setConversationModel = async (
  port: PersistencePort,
  profileId: string,
  conversationId: string,
  providerId: string,
  modelId: string,
  now: () => Date = () => new Date()
): Promise<void> => {
  await port.transaction(async () => {
    const existing = await port.chatConversations.get(
      profileId,
      conversationId
    );
    if (!existing) return;
    await port.chatConversations.put({
      ...existing,
      providerId,
      modelId,
      updatedAt: now().toISOString(),
    });
  });
};
