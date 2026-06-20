import { useState } from "react";

export type ConversationTitleInputProps = {
  initialTitle: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
};

/** Inline rename field for a conversation row: commits on blur/Enter, cancels
 * on Escape. The parent decides how to handle an empty commit. */
export function ConversationTitleInput({
  initialTitle,
  onCommit,
  onCancel,
}: ConversationTitleInputProps) {
  const [draft, setDraft] = useState(initialTitle);
  return (
    <input
      aria-label="Conversation title"
      className="w-full rounded-md bg-slate-800 px-2 py-1 text-sm text-slate-100"
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(draft);
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}
