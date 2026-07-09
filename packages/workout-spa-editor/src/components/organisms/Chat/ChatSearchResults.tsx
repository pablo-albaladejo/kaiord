import type { ChatSearchResult } from "../../../application/chat/search-conversations";
import { useTranslate } from "../../../i18n/use-translate";
import { SnippetText } from "./SnippetText";

export type ChatSearchResultsProps = {
  results: ChatSearchResult[];
  /** Open a conversation (e.g. from a title match) without focusing a message. */
  onSelect: (conversationId: string) => void;
  /** Open a conversation and focus a specific matched message. */
  onResultSelect: (conversationId: string, messageId: string) => void;
};

/** Search results grouped by conversation: a title row plus each matched message
 * as a snippet with static-yellow highlights. Replaces the conversation list
 * while a search is active. */
export function ChatSearchResults({
  results,
  onSelect,
  onResultSelect,
}: ChatSearchResultsProps) {
  const t = useTranslate("chat");
  if (results.length === 0) {
    return (
      <p
        data-testid="chat-search-empty"
        className="px-2 py-4 text-sm text-slate-400"
      >
        {t("search.noMatches")}
      </p>
    );
  }

  return (
    <div
      data-testid="chat-search-results"
      className="flex w-full flex-col gap-2"
    >
      {results.map((result) => (
        <div key={result.conversationId} className="flex flex-col gap-1">
          <button
            type="button"
            className="truncate text-left text-sm font-medium text-slate-200 hover:text-slate-50"
            onClick={() => onSelect(result.conversationId)}
          >
            {result.title}
          </button>
          {result.messageMatches.map((match) => (
            <button
              key={match.messageId}
              type="button"
              data-testid={`chat-search-result-${match.messageId}`}
              className="rounded px-2 py-1 text-left text-xs text-slate-400 hover:bg-slate-800"
              onClick={() =>
                onResultSelect(result.conversationId, match.messageId)
              }
            >
              <SnippetText text={match.snippet} ranges={match.ranges} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
