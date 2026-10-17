import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

export type ChatComposerProps = {
  onSend: (text: string) => void;
  disabled: boolean;
  /** Seeds the input on mount (e.g. an "adjust with AI" deep-link prefill). */
  initialText?: string;
  /** While a reply streams, the send button becomes a Stop control. */
  streaming?: boolean;
  onStop?: () => void;
};

/** Message input. Enter sends; Shift+Enter inserts a newline. */
export function ChatComposer({
  onSend,
  disabled,
  initialText,
  streaming = false,
  onStop,
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
        className="flex-1 resize-none rounded-2xl border border-edge bg-surface-deep px-3 py-2 text-[14px] text-ink-strong placeholder:text-ink-muted"
      />
      {streaming && onStop ? (
        <Button variant="ghost" onClick={onStop}>
          {t("composer.stop")}
        </Button>
      ) : (
        <Button
          variant="cta"
          onClick={submit}
          disabled={disabled || text.trim() === ""}
        >
          {t("composer.send")}
        </Button>
      )}
    </div>
  );
}
