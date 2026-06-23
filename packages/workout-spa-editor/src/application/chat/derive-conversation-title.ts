/**
 * Derives a conversation title from the user's first message: whitespace
 * is collapsed and trimmed, then truncated to a bounded stored length with
 * an ellipsis when cut. This is the persisted value (and the rename
 * prefill); the conversation list may truncate it further visually. An
 * empty message yields a stable fallback so a thread is never titleless.
 */

export const MAX_CONVERSATION_TITLE_LENGTH = 80;
export const FALLBACK_CONVERSATION_TITLE = "New conversation";

export const deriveConversationTitle = (firstMessage: string): string => {
  const normalized = firstMessage.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) return FALLBACK_CONVERSATION_TITLE;
  if (normalized.length <= MAX_CONVERSATION_TITLE_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_CONVERSATION_TITLE_LENGTH - 1).trimEnd()}…`;
};
