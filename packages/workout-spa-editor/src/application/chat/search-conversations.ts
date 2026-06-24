/**
 * Chat search use case (pure).
 *
 * Searches a profile's conversations by words across titles and message content.
 * A conversation matches when its title plus all of its messages together contain
 * every query token (accent/case-insensitive substring); tokens may be spread
 * across different messages. Results are ranked by a relevance score — a title
 * match (the whole query satisfied by the title) boosts the conversation, then
 * token frequency adds in, with `updatedAt` breaking ties — and each conversation
 * carries its matched messages ranked by distinct tokens matched.
 */
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import {
  countOccurrences,
  normalizeSearchText,
  tokenize,
} from "./normalize-search-text";
import {
  buildMessageMatches,
  type ChatSearchMessageMatch,
  groupByConversation,
} from "./search-conversation-messages";

const TITLE_MATCH_BOOST = 1_000_000;

export type ChatSearchResult = {
  conversationId: string;
  title: string;
  titleMatch: boolean;
  messageMatches: ChatSearchMessageMatch[];
};

type ScoredResult = {
  score: number;
  updatedAt: string;
  result: ChatSearchResult;
};

const scoreConversation = (
  conversation: ChatConversationRecord,
  messages: ChatMessageRecord[],
  tokens: string[]
): ScoredResult | null => {
  const titleNormalized = normalizeSearchText(conversation.title);
  const contents = messages.map((message) =>
    normalizeSearchText(message.content)
  );
  const blob = `${titleNormalized} ${contents.join(" ")}`;
  if (!tokens.every((token) => blob.includes(token))) return null;
  const titleMatch = tokens.every((token) => titleNormalized.includes(token));
  const frequency = tokens.reduce(
    (sum, token) => sum + countOccurrences(blob, token),
    0
  );
  return {
    score: (titleMatch ? TITLE_MATCH_BOOST : 0) + frequency,
    updatedAt: conversation.updatedAt,
    result: {
      conversationId: conversation.id,
      title: conversation.title,
      titleMatch,
      messageMatches: buildMessageMatches(messages, tokens),
    },
  };
};

export const searchConversations = (
  query: string,
  conversations: ChatConversationRecord[],
  messages: ChatMessageRecord[]
): ChatSearchResult[] => {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const byConversation = groupByConversation(messages);
  const scored: ScoredResult[] = [];
  for (const conversation of conversations) {
    const entry = scoreConversation(
      conversation,
      byConversation.get(conversation.id) ?? [],
      tokens
    );
    if (entry) scored.push(entry);
  }
  scored.sort(
    (a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt)
  );
  return scored.map((entry) => entry.result);
};
