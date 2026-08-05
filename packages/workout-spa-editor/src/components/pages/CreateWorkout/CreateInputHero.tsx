import type { ChangeEvent } from "react";

import { useThresholdProvenance } from "../../../hooks/use-threshold-provenance";
import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { Pill } from "../../atoms/Pill";
import { EXAMPLE_PROMPTS } from "./example-prompts";

export type CreateInputHeroProps = {
  sport: ActiveSport;
  profile: Profile | null;
  promptText: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
};

const TEXTAREA_CLASS =
  "w-full resize-none rounded-[12px] border border-edge bg-surface-deep p-3 text-ink-strong focus:outline-none focus:ring-2 focus:ring-accent";

export function CreateInputHero({
  sport,
  profile,
  promptText,
  onPromptChange,
  onGenerate,
}: CreateInputHeroProps) {
  const t = useTranslate("create-workout");
  const provenance = useThresholdProvenance(profile, sport);
  const canGenerate = promptText.trim().length > 0;
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    onPromptChange(e.target.value);

  return (
    <div className="rounded-[16px] border border-edge bg-surface p-4">
      <div className="mb-1 flex items-center gap-2">
        <Icon icon={ICON_MAP.sparkle} size="sm" className="text-accent" />
        <span className="text-[15px] font-semibold text-ink-strong">
          {t("hero.describe")}
        </span>
      </div>
      {/* Principle 8: the reason goes above the thing it justifies. This is the
          number every watt and pace the generator writes is measured against. */}
      {provenance && (
        <p className="mb-3 text-[12.5px] leading-relaxed tabular-nums text-ink-muted">
          {t("hero.writtenAgainst", provenance)}
        </p>
      )}
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
    </div>
  );
}
