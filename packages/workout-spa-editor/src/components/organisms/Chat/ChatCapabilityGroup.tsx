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
  const name = t(`capabilities.group.${section.group}`);
  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
        {name}
      </h3>
      {section.writes && (
        <p className="m-0 text-[12px] text-ink-muted">
          {t("capabilities.youConfirm")}
        </p>
      )}
      <ul className="m-0 list-none p-0 text-[13px] text-ink-muted">
        {section.tools.map((tool) => (
          <li key={tool}>{t(`capabilities.tool.${tool}`)}</li>
        ))}
      </ul>
      <div
        role="group"
        aria-label={t("capabilities.suggestions", { group: name })}
        className="flex flex-wrap gap-2"
      >
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
