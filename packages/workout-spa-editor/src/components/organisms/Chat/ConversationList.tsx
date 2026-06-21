import type { ChatConversationRecord } from "../../../types/chat/chat-conversation-record";
import { ConversationListItem } from "./ConversationListItem";

export type ConversationListProps = {
  conversations: ChatConversationRecord[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

/** Sidebar list of the profile's conversations (newest-active first) plus a
 * "New conversation" action. */
export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: ConversationListProps) {
  return (
    <nav
      aria-label="Conversations"
      className="flex w-full flex-col gap-1"
      data-testid="conversation-list"
    >
      <button
        type="button"
        className="mb-1 rounded-md border border-slate-700 px-2 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
        onClick={onNew}
      >
        + New conversation
      </button>
      {conversations.map((c) => (
        <ConversationListItem
          key={c.id}
          conversation={c}
          active={c.id === activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </nav>
  );
}
