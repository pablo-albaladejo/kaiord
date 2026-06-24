/**
 * Per-conversation message matching for chat search.
 *
 * `groupByConversation` buckets a profile's flat message list by `conversationId`
 * (preserving the chronological order of the source query). `buildMessageMatches`
 * keeps the messages that contain at least one token, builds a highlighted snippet
 * for each, and orders them so messages matching more distinct tokens surface
 * first — a stable sort, so equal-rank messages keep their chronological order.
 */
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import type { HighlightRange } from "./build-snippet";
import { buildSnippet, findMatchRanges } from "./build-snippet";
import { normalizeSearchText } from "./normalize-search-text";

export type ChatSearchMessageMatch = {
  messageId: string;
  role: ChatMessageRecord["role"];
  snippet: string;
  ranges: HighlightRange[];
};

export const groupByConversation = (
  messages: ChatMessageRecord[]
): Map<string, ChatMessageRecord[]> => {
  const map = new Map<string, ChatMessageRecord[]>();
  for (const message of messages) {
    const list = map.get(message.conversationId);
    if (list) list.push(message);
    else map.set(message.conversationId, [message]);
  }
  return map;
};

export const buildMessageMatches = (
  messages: ChatMessageRecord[],
  tokens: string[]
): ChatSearchMessageMatch[] => {
  const ranked: { count: number; match: ChatSearchMessageMatch }[] = [];
  for (const message of messages) {
    const normalized = normalizeSearchText(message.content);
    const matched = tokens.filter((token) => normalized.includes(token));
    if (matched.length === 0) continue;
    const ranges = findMatchRanges(message.content, matched);
    const snippet = buildSnippet(message.content, ranges);
    ranked.push({
      count: matched.length,
      match: {
        messageId: message.id,
        role: message.role,
        snippet: snippet.text,
        ranges: snippet.ranges,
      },
    });
  }
  return ranked.sort((a, b) => b.count - a.count).map((entry) => entry.match);
};
