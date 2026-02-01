/**
 * HelpHeader Component
 *
 * Header section for help page.
 */

import { Play } from "lucide-react";
import { Button } from "../../../atoms/Button/Button";

type HelpHeaderProps = {
  onReplayTutorial?: () => void;
};

export function HelpHeader({ onReplayTutorial }: HelpHeaderProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Help & Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn how to use the Workout Editor to create and manage structured
            workout files
          </p>
        </div>
        {onReplayTutorial && (
          <Button
            variant="secondary"
            onClick={onReplayTutorial}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Replay Tutorial
          </Button>
        )}
      </div>
    </div>
  );
}
