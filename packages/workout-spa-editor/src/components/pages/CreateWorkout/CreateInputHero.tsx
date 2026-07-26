import type { ChangeEvent } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { Pill } from "../../atoms/Pill";
import { EXAMPLE_PROMPTS } from "./example-prompts";

export type CreateInputHeroProps = {
  sportLabel: string;
  promptText: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
};

const TEXTAREA_CLASS =
  "w-full bg-surface-deep border border-edge rounded-[13px] p-3 text-ink-strong resize-none focus:outline-none focus:ring-2 focus:ring-primary-500";

export function CreateInputHero({
  sportLabel,
  promptText,
  onPromptChange,
  onGenerate,
}: CreateInputHeroProps) {
  const t = useTranslate("create-workout");
  const canGenerate = promptText.trim().length > 0;
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    onPromptChange(e.target.value);

  return (
    <div className="rounded-[16px] border border-edge bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon icon={ICON_MAP.sparkle} size="sm" className="text-accent" />
        <span className="text-[15px] font-semibold text-ink-strong">
          {t("hero.describe")}
        </span>
      </div>
      <textarea
        rows={3}
        value={promptText}
        onChange={handleChange}
        placeholder={t("hero.placeholder")}
        className={TEXTAREA_CLASS}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => {
          const label = t(prompt.label);
          return (
            <button
              key={prompt.key}
              type="button"
              onClick={() => onPromptChange(label)}
            >
              <Pill tone="neutral">{label}</Pill>
            </button>
          );
        })}
      </div>
      <Button
        className={`mt-4 w-full ${canGenerate ? "" : "opacity-50"}`}
        disabled={!canGenerate}
        onClick={onGenerate}
      >
        <Icon icon={ICON_MAP.sparkle} size="sm" color="inherit" />
        {t("hero.generate")}
      </Button>
      <p className="mt-2 text-center text-[12.5px] text-ink-muted">
        {t("hero.builtAround", { sport: sportLabel })}
      </p>
    </div>
  );
}
