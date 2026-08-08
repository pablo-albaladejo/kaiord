import type { Sport } from "@kaiord/core";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { Button } from "../../atoms/Button";
import { AiSuccessActionsContainer } from "./AiSuccessActionsContainer";
import { ModelSelector } from "./ModelSelector";
import { SportSelect } from "./SportSelect";
import { useAiGeneration } from "./useAiGeneration";
import { ZoneIndicator } from "./ZoneIndicator";

export const AiWorkoutForm: React.FC = () => {
  const t = useTranslate("create-workout");
  const [text, setText] = useState("");
  const [sport, setSport] = useState("");
  const generation = useAiRuntimeStore((s) => s.generation);
  const { generate } = useAiGeneration();
  const isLoading = generation.status === "loading";
  const isSuccess = generation.status === "success";

  const handleGenerate = () => {
    if (!text.trim() || isLoading) return;
    generate(text, (sport || undefined) as Sport | undefined);
  };

  return (
    <div className="space-y-4">
      <label htmlFor="ai-workout-description" className="sr-only">
        {t("form.descriptionLabel")}
      </label>
      <textarea
        id="ai-workout-description"
        aria-label={t("form.descriptionLabel")}
        className="w-full rounded-lg border border-edge bg-surface p-4 text-sm shadow-inner placeholder:text-ink-muted text-ink-strong focus:border-accent focus:ring-2 focus:ring-accent/40"
        rows={4}
        maxLength={2000}
        placeholder={t("form.placeholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      <ZoneIndicator sport={sport} />
      <div className="flex flex-wrap items-end gap-3">
        <SportSelect value={sport} onChange={setSport} />
        <ModelSelector />
        <Button
          onClick={handleGenerate}
          disabled={!text.trim() || isLoading}
          loading={isLoading}
          variant="primary"
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          {t("form.generate")}
        </Button>
      </div>
      {generation.status === "error" && (
        <p className="text-sm text-danger-text">{generation.message}</p>
      )}
      {isSuccess && <AiSuccessActionsContainer onRegenerate={handleGenerate} />}
    </div>
  );
};
