import { useState } from "react";
import { AiWorkoutInputEmpty } from "./AiWorkoutInputEmpty";
import { ModelSelector } from "./ModelSelector";
import { SportSelect } from "./SportSelect";
import { useAiGeneration } from "./useAiGeneration";
import { useAiStore } from "../../../store/ai-store";
import { Button } from "../../atoms/Button";
import type { Sport } from "@kaiord/core";

type AiWorkoutInputProps = {
  onSettingsClick: () => void;
};

export const AiWorkoutInput: React.FC<AiWorkoutInputProps> = ({
  onSettingsClick,
}) => {
  const [text, setText] = useState("");
  const [sport, setSport] = useState("");
  const { providers, generation, hydrated } = useAiStore();
  const { generate } = useAiGeneration();
  const isLoading = generation.status === "loading";
  const hasProviders = providers.length > 0;

  if (!hydrated) return null;

  const handleGenerate = () => {
    if (!text.trim() || isLoading) return;
    generate(text, (sport || undefined) as Sport | undefined);
  };

  if (!hasProviders) {
    return <AiWorkoutInputEmpty onSettingsClick={onSettingsClick} />;
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <label htmlFor="ai-workout-description" className="sr-only">
        Workout description
      </label>
      <textarea
        id="ai-workout-description"
        aria-label="Workout description"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        rows={3}
        maxLength={2000}
        placeholder="Describe your workout (e.g., '45min sweet spot cycling, 10min warmup, 3x10min at 90% FTP, 5min cooldown')"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex items-end gap-3">
        <SportSelect value={sport} onChange={setSport} />
        <ModelSelector />
        <Button
          onClick={handleGenerate}
          disabled={!text.trim() || isLoading}
          loading={isLoading}
        >
          Generate
        </Button>
      </div>
      {generation.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {generation.message}
        </p>
      )}
    </div>
  );
};
