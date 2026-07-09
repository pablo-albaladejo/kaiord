import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

export type ChatComposerProps = {
  onSend: (text: string) => void;
  disabled: boolean;
  /** Seeds the input on mount (e.g. an "adjust with AI" deep-link prefill). */
  initialText?: string;
};

/** Message input. Enter sends; Shift+Enter inserts a newline. */
export function ChatComposer({
  onSend,
  disabled,
  initialText,
}: ChatComposerProps) {
  const t = useTranslate("chat");
  const [text, setText] = useState(initialText ?? "");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        aria-label={t("composer.messageLabel")}
        rows={2}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={t("composer.placeholder")}
        className="flex-1 resize-none rounded-2xl border border-slate-700 bg-surface-deep px-3 py-2 text-[14px] text-slate-50 placeholder:text-slate-500"
      />
      <Button onClick={submit} disabled={disabled || text.trim() === ""}>
        {t("composer.send")}
      </Button>
    </div>
  );
}
