import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { ChatConversationRecord } from "../../../types/chat/chat-conversation-record";
import { ConversationTitleInput } from "./ConversationTitleInput";

export type ConversationListItemProps = {
  conversation: ChatConversationRecord;
  active: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

/** One conversation row: select, inline rename, and two-step delete. */
export function ConversationListItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: ConversationListItemProps) {
  const t = useTranslate("chat");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <ConversationTitleInput
        initialTitle={conversation.title}
        onCommit={(title) => {
          setEditing(false);
          if (title.trim()) onRename(conversation.id, title);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-md px-2 py-1 text-sm ${
        active ? "bg-slate-800 text-slate-100" : "text-slate-300"
      }`}
    >
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left hover:text-slate-100"
        onClick={() => onSelect(conversation.id)}
      >
        {conversation.title}
      </button>
      <button
        type="button"
        aria-label={t("item.rename")}
        className="shrink-0 px-1 text-slate-500 hover:text-slate-200"
        onClick={() => setEditing(true)}
      >
        ✎
      </button>
      <button
        type="button"
        aria-label={confirmDelete ? t("item.confirmDelete") : t("item.delete")}
        className="shrink-0 px-1 text-slate-500 hover:text-red-400"
        onClick={() =>
          confirmDelete ? onDelete(conversation.id) : setConfirmDelete(true)
        }
      >
        {confirmDelete ? "✓" : "🗑"}
      </button>
    </div>
  );
}
