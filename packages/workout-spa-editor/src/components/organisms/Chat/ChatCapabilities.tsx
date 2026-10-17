import { useEffect, useId, useRef } from "react";

import { chatCapabilitySections } from "../../../application/chat/chat-capabilities";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { ChatCapabilityGroup } from "./ChatCapabilityGroup";

export type ChatCapabilitiesProps = {
  /** Adds an example prompt to the composer; never sends it. */
  onPick: (text: string) => void;
  /** When set, the catalog was opened on demand and can be dismissed. */
  onClose?: () => void;
  id?: string;
  /** Moves focus to the heading, so opening it on request is announced. */
  focusOnMount?: boolean;
};

const SECTIONS = chatCapabilitySections();

/** What the assistant can look up, log and do, rendered from the local
 * capability catalog (no model call). Example chips fill the composer. */
export function ChatCapabilities({
  onPick,
  onClose,
  id,
  focusOnMount,
}: ChatCapabilitiesProps) {
  const t = useTranslate("chat");
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-testid="chat-capabilities"
      className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="m-0 text-[15px] font-semibold text-ink-strong"
        >
          {t("capabilities.title")}
        </h2>
        {onClose && (
          <Button variant="tertiary" size="sm" onClick={onClose}>
            {t("capabilities.close")}
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => (
          <ChatCapabilityGroup
            key={section.group}
            section={section}
            onPick={onPick}
          />
        ))}
      </div>
      <p className="m-0 text-[12px] text-ink-muted">
        {t("capabilities.fillHint")} {t("capabilities.nothingSaved")}
      </p>
    </section>
  );
}
