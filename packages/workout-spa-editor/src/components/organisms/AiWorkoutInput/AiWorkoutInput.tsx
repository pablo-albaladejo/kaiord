import { useState } from "react";
import type { Sport } from "@kaiord/core";
import { Button } from "../../atoms/Button";
import { useAiStore } from "../../../store/ai-store";
import { ModelSelector } from "./ModelSelector";
import { useAiGeneration } from "./useAiGeneration";

const SPORT_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
  { value: "generic", label: "Generic" },
];

type AiWorkoutInputProps = {
  onSettingsClick: () => void;
};

export const AiWorkoutInput: React.FC<AiWorkoutInputProps> = ({
  onSettingsClick,
}) => {
  const [text, setText] = useState("");
  const [sport, setSport] = useState("");
  const { providers, generation } = useAiStore();
  const { generate } = useAiGeneration();
  const isLoading = generation.status === "loading";
  const hasProviders = providers.length > 0;

  const handleGenerate = () => {
    if (!text.trim() || isLoading) return;
    generate(text, (sport || undefined) as Sport | undefined);
  };

  if (!hasProviders) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Configure an AI provider to generate workouts from text.
        </p>
        <Button size="sm" onClick={onSettingsClick}>
          Open Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <textarea
        className="w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        rows={3}
        maxLength={2000}
        placeholder="Describe your workout (e.g., '45min sweet spot cycling, 10min warmup, 3x10min at 90% FTP, 5min cooldown')"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex items-end gap-3">
        <div className="w-full">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Sport
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            {SPORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
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
