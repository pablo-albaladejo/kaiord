/**
 * clearConversation — application use case.
 *
 * Removes the profile's chat transcript and records one `[chatMessages+id]`
 * tombstone per deleted message so the clear propagates across devices. The
 * profile itself survives (so the profile-tombstone cascade path does not
 * apply), which is exactly why an explicit clear must tombstone its rows —
 * otherwise a stale snapshot from another device would resurrect them.
 *
 * Runs in one `port.transaction`: a mid-clear failure rolls back both the
 * deletes and the tombstone writes.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export const clearConversation = async (
  port: PersistencePort,
  profileId: string,
  now: () => Date = () => new Date()
): Promise<void> => {
  await port.transaction(async () => {
    const messages = await port.chatMessages.listByProfile(profileId);
    await port.chatMessages.deleteByProfile(profileId);
    const deletedAt = now().toISOString();
    for (const message of messages) {
      await port.tombstones.put({
        table: "chatMessages",
        id: message.id,
        deletedAt,
        profileId,
      });
    }
  });
};
