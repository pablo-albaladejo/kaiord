import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

export type ChatGateNoticeProps =
  { kind: "noProfile" } | { kind: "missingKey"; label: string };

const TARGET = { noProfile: "/athlete", missingKey: "/settings/ai" } as const;

/** Why the chat cannot run yet, and the one action that unblocks it. */
export function ChatGateNotice(props: ChatGateNoticeProps) {
  const t = useTranslate("chat");
  const [, navigate] = useLocation();
  const key = `gate.${props.kind}`;
  const label = props.kind === "missingKey" ? props.label : "";

  return (
    <div
      data-testid={`chat-gate-${props.kind}`}
      className="rounded-[16px] border border-dashed border-edge bg-surface-deep p-6 text-center"
    >
      <p className="mb-1 text-[15px] font-semibold text-ink-strong">
        {t(`${key}.title`)}
      </p>
      <p className="mb-4 text-[12.5px] text-ink-muted">
        {t(`${key}.body`, { label })}
      </p>
      <Button onClick={() => navigate(TARGET[props.kind])}>
        {t(`${key}.action`)}
      </Button>
    </div>
  );
}
