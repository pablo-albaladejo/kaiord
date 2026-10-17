import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { ChatCapabilities } from "./ChatCapabilities";

export type ChatCapabilitiesHelpProps = {
  open: boolean;
  /** Omitted for the empty state, where the catalog cannot be dismissed. */
  onOpenChange?: (open: boolean) => void;
  onPick: (text: string) => void;
};

/** "What can I do?" in a running conversation: a button that opens the local
 * capability catalog, answered without calling the model. */
export function ChatCapabilitiesHelp({
  open,
  onOpenChange,
  onPick,
}: ChatCapabilitiesHelpProps) {
  const t = useTranslate("chat");
  if (open)
    return (
      <ChatCapabilities
        onPick={onPick}
        onClose={onOpenChange && (() => onOpenChange(false))}
      />
    );
  return (
    <Button
      variant="tertiary"
      size="sm"
      className="self-start"
      onClick={() => onOpenChange?.(true)}
    >
      {t("capabilities.help")}
    </Button>
  );
}
