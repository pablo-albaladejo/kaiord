import type { ChatCapabilitySection } from "../../../application/chat/chat-capabilities";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

export type ChatCapabilityGroupProps = {
  section: ChatCapabilitySection;
  onPick: (text: string) => void;
};

/** One catalog group (look up / log / do): what it covers and its example
 * chips. Writing groups say the user confirms each action. */
export function ChatCapabilityGroup({
  section,
  onPick,
}: ChatCapabilityGroupProps) {
  const t = useTranslate("chat");
  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
        {t(`capabilities.group.${section.group}`)}
        {section.writes && (
          <span className="ml-1 font-normal normal-case">
            · {t("capabilities.youConfirm")}
          </span>
        )}
      </h3>
      <ul className="m-0 list-none p-0 text-[13px] text-ink-muted">
        {section.tools.map((name) => (
          <li key={name}>{t(`capabilities.tool.${name}`)}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {section.examples.map((id) => {
          const text = t(`capabilities.example.${id}`);
          return (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => onPick(text)}
            >
              {text}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
