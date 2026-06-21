/**
 * renameConversation — application use case.
 *
 * Sets a non-empty title and advances `updatedAt`. Empty/whitespace-only
 * titles are rejected with no write (the prior title is left unchanged). The
 * read is profile-scoped, so a foreign/absent id is a no-op.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export const renameConversation = async (
  port: PersistencePort,
  profileId: string,
  conversationId: string,
  title: string,
  now: () => Date = () => new Date()
): Promise<void> => {
  const trimmed = title.trim();
  if (trimmed.length === 0) return;
  await port.transaction(async () => {
    const existing = await port.chatConversations.get(
      profileId,
      conversationId
    );
    if (!existing) return;
    await port.chatConversations.put({
      ...existing,
      title: trimmed,
      updatedAt: now().toISOString(),
    });
  });
};
