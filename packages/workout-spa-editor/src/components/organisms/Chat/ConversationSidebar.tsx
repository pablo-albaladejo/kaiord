import type { ChatSearchResult } from "../../../application/chat/search-conversations";
import { ChatSearchBox } from "./ChatSearchBox";
import { ChatSearchResults } from "./ChatSearchResults";
import {
  ConversationList,
  type ConversationListProps,
} from "./ConversationList";

export type ConversationSidebarProps = ConversationListProps & {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchActive: boolean;
  searchResults: ChatSearchResult[];
  onResultSelect: (conversationId: string, messageId: string) => void;
};

/** Left chat column: a search box over either the conversation list or, while a
 * search is active, the search results panel. */
export function ConversationSidebar({
  searchQuery,
  onSearchChange,
  searchActive,
  searchResults,
  onResultSelect,
  ...list
}: ConversationSidebarProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <ChatSearchBox value={searchQuery} onChange={onSearchChange} />
      {searchActive ? (
        <ChatSearchResults
          results={searchResults}
          onSelect={list.onSelect}
          onResultSelect={onResultSelect}
        />
      ) : (
        <ConversationList {...list} />
      )}
    </div>
  );
}
