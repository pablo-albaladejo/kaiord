import { Sparkles } from "lucide-react";
import { useState } from "react";
import { ModelSelector } from "./ModelSelector";
import { SportSelect } from "./SportSelect";
import { useAiGeneration } from "./useAiGeneration";
import { useAiStore } from "../../../store/ai-store";
import { Button } from "../../atoms/Button";
import type { Sport } from "@kaiord/core";

export const AiWorkoutForm: React.FC = () => {
  const [text, setText] = useState("");
  const [sport, setSport] = useState("");
  const { generation } = useAiStore();
  const { generate } = useAiGeneration();
  const isLoading = generation.status === "loading";

  const handleGenerate = () => {
    if (!text.trim() || isLoading) return;
    generate(text, (sport || undefined) as Sport | undefined);
  };

  return (
    <div className="space-y-4">
      <label htmlFor="ai-workout-description" className="sr-only">
        Workout description
      </label>
      <textarea
        id="ai-workout-description"
        aria-label="Workout description"
        className="w-full rounded-lg border border-blue-200 bg-white p-4 text-sm shadow-inner placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-800"
        rows={4}
        maxLength={2000}
        placeholder="e.g., '45min sweet spot cycling: 10min warmup, 3x10min at 90% FTP with 2min recovery, 5min cooldown'"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex flex-wrap items-end gap-3">
        <SportSelect value={sport} onChange={setSport} />
        <ModelSelector />
        <Button
          onClick={handleGenerate}
          disabled={!text.trim() || isLoading}
          loading={isLoading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          Generate Workout
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
