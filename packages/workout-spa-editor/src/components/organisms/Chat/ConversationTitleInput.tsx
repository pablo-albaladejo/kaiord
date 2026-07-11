import { useRef, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";

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
  const t = useTranslate("chat");
  const [draft, setDraft] = useState(initialTitle);
  // Escape sets this so the trailing blur (focus loss on unmount) does not
  // commit. Enter blurs to commit exactly once via onBlur.
  const suppressBlurCommitRef = useRef(false);
  return (
    <input
      aria-label={t("titleInput.label")}
      className="w-full rounded-md bg-surface px-2 py-1 text-sm text-ink-strong"
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (suppressBlurCommitRef.current) {
          suppressBlurCommitRef.current = false;
          return;
        }
        onCommit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          suppressBlurCommitRef.current = true;
          onCancel();
        }
      }}
    />
  );
}
