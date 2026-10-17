import { useId, useRef } from "react";

import type { ChatCapabilitiesState } from "../../../hooks/use-chat-capabilities";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { ChatCapabilities } from "./ChatCapabilities";

export type ChatCapabilitiesHelpProps = ChatCapabilitiesState & {
  /** Empty conversation: the catalog is the empty state, always shown. */
  empty?: boolean;
};

/** "What can I do?", answered from the local catalog without calling the
 * model. Empty conversation: the catalog itself (focused when asked for).
 * Otherwise a disclosure: opening moves focus to the catalog heading,
 * closing returns it to the trigger. */
export function ChatCapabilitiesHelp({
  open,
  onOpenChange,
  onPick,
  empty,
}: ChatCapabilitiesHelpProps) {
  const t = useTranslate("chat");
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (empty)
    return (
      <ChatCapabilities
        key={open ? "asked" : "idle"}
        focusOnMount={open}
        onPick={onPick}
      />
    );
  const close = () => {
    onOpenChange(false);
    triggerRef.current?.focus();
  };
  return (
    <>
      <Button
        ref={triggerRef}
        variant="tertiary"
        size="sm"
        className="self-start"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        {t("capabilities.help")}
      </Button>
      {open && (
        <ChatCapabilities
          id={panelId}
          focusOnMount
          onPick={onPick}
          onClose={close}
        />
      )}
    </>
  );
}
