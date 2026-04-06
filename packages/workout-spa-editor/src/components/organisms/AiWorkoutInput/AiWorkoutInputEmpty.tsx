import { Settings } from "lucide-react";

import { Button } from "../../atoms/Button";

type AiWorkoutInputEmptyProps = {
  onSettingsClick: () => void;
};

export const AiWorkoutInputEmpty = ({
  onSettingsClick,
}: AiWorkoutInputEmptyProps) => (
  <div className="rounded-lg border border-dashed border-blue-300 bg-white/60 p-5 text-center dark:border-blue-700 dark:bg-gray-800/60">
    <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
      Configure an AI provider to get started
    </p>
    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
      Supports Anthropic (Claude), OpenAI (GPT), and Google (Gemini)
    </p>
    <Button size="sm" onClick={onSettingsClick}>
      <Settings className="mr-1.5 h-3.5 w-3.5" />
      Open Settings
    </Button>
  </div>
);
