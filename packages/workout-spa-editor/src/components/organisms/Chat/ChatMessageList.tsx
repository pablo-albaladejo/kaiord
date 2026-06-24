import { useEffect, useRef } from "react";

import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";

const ROLE_STYLE: Record<string, string> = {
  user: "self-end bg-sky-600 text-white",
  assistant: "self-start bg-slate-800 text-slate-50",
  tool: "self-start bg-slate-900 text-slate-400 italic",
};

const ROLE_LABEL: Record<string, string> = {
  user: "You",
  assistant: "Assistant",
  tool: "Action",
};

export type ChatMessageListProps = {
  messages: ChatMessageRecord[];
  /** When set, that message is scrolled into view and highlighted statically. */
  focusMessageId?: string | null;
};

/** Read-only transcript renderer. Bubbles are aligned by role; a focused message
 * (from a search result) is scrolled into view and ringed in static yellow. */
export function ChatMessageList({
  messages,
  focusMessageId,
}: ChatMessageListProps) {
  const focusedRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (focusMessageId && focusedRef.current)
      focusedRef.current.scrollIntoView({ block: "center" });
  }, [focusMessageId]);

  if (messages.length === 0) {
    return (
      <p className="p-8 text-center text-[13px] text-slate-500">
        Start a conversation — ask about your recent workouts or sleep.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" data-testid="chat-messages">
      {messages.map((m) => {
        const focused = m.id === focusMessageId;
        return (
          <li
            key={m.id}
            ref={focused ? focusedRef : undefined}
            data-focused={focused || undefined}
            className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[14px] ${ROLE_STYLE[m.role] ?? ROLE_STYLE.assistant} ${focused ? "ring-2 ring-yellow-300" : ""}`}
          >
            <span className="mb-0.5 block text-[11px] font-semibold opacity-70">
              {ROLE_LABEL[m.role] ?? m.role}
            </span>
            {m.content}
          </li>
        );
      })}
    </ul>
  );
}
