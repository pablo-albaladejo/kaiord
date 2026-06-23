/**
 * v24 → v25 migration — multi-conversation chat.
 *
 * Buckets every pre-existing `chatMessages` row into one seeded conversation
 * per profile ("Conversation 1") so no transcript is lost when threads become
 * first-class. The seeded conversation's `createdAt`/`updatedAt` is the
 * newest message's `createdAt` so it sorts sensibly at the top of the list.
 * `conversationId` is backfilled on every message.
 *
 * Idempotent: the seed id is derived deterministically from the profile id,
 * and Dexie's once-per-bump version gate guards re-entry. Profiles with no
 * messages get no conversation (first use creates one lazily).
 */
import type { Transaction } from "dexie";

import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";

type RawMessage = { id: string; profileId: string; createdAt: string };

/** Deterministic id for the migration-seeded "Conversation 1" of a profile. */
export const seededConversationId = (profileId: string): string =>
  `${profileId}:conversation-1`;

export const applyV25Upgrade = async (tx: Transaction): Promise<void> => {
  const messages = (await tx.table("chatMessages").toArray()) as RawMessage[];
  if (messages.length === 0) return;

  const newestByProfile = new Map<string, string>();
  for (const m of messages) {
    const prev = newestByProfile.get(m.profileId);
    if (prev === undefined || m.createdAt > prev)
      newestByProfile.set(m.profileId, m.createdAt);
  }

  const conversations: ChatConversationRecord[] = [
    ...newestByProfile.entries(),
  ].map(([profileId, newest]) => ({
    id: seededConversationId(profileId),
    profileId,
    title: "Conversation 1",
    createdAt: newest,
    updatedAt: newest,
  }));
  await tx.table("chatConversations").bulkPut(conversations);

  await tx
    .table("chatMessages")
    .toCollection()
    .modify((m: RawMessage & { conversationId?: string }) => {
      m.conversationId = seededConversationId(m.profileId);
    });
};
