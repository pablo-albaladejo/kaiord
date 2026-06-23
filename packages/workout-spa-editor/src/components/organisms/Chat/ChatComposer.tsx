import { useState } from "react";

import { Button } from "../../atoms/Button";

export type ChatComposerProps = {
  onSend: (text: string) => void;
  disabled: boolean;
};

/** Message input. Enter sends; Shift+Enter inserts a newline. */
export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        aria-label="Message"
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
        placeholder="Ask about your training or health…"
        className="flex-1 resize-none rounded-2xl border border-slate-700 bg-surface-deep px-3 py-2 text-[14px] text-slate-50 placeholder:text-slate-500"
      />
      <Button onClick={submit} disabled={disabled || text.trim() === ""}>
        Send
      </Button>
    </div>
  );
}
