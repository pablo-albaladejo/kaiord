import type { ChangeEvent } from "react";

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
  "w-full bg-surface-deep border border-slate-800 rounded-[13px] p-3 text-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500";

export function CreateInputHero({
  sportLabel,
  promptText,
  onPromptChange,
  onGenerate,
}: CreateInputHeroProps) {
  const canGenerate = promptText.trim().length > 0;
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    onPromptChange(e.target.value);

  return (
    <div className="rounded-[16px] border border-slate-800 bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon icon={ICON_MAP.sparkle} size="sm" className="text-sky-400" />
        <span className="text-[15px] font-semibold text-slate-50">
          Describe it in plain words
        </span>
      </div>
      <textarea
        rows={3}
        value={promptText}
        onChange={handleChange}
        placeholder="e.g. 4×4 VO₂ max intervals with a long warm-up…"
        className={TEXTAREA_CLASS}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPromptChange(prompt)}
          >
            <Pill tone="neutral">{prompt}</Pill>
          </button>
        ))}
      </div>
      <Button
        className={`mt-4 w-full ${canGenerate ? "" : "opacity-50"}`}
        disabled={!canGenerate}
        onClick={onGenerate}
      >
        <Icon icon={ICON_MAP.sparkle} size="sm" color="inherit" />
        Generate workout
      </Button>
      <p className="mt-2 text-center text-[12.5px] text-slate-500">
        Built around your {sportLabel} zones
      </p>
    </div>
  );
}
