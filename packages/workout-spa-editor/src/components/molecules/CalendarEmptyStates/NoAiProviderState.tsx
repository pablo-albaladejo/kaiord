/**
 * NoAiProviderState - No AI provider configured.
 */

import { Bot } from "lucide-react";

import { useSettingsDialog } from "../../../contexts";

export function NoAiProviderState() {
  const { show } = useSettingsDialog();

  return (
    <div
      data-testid="no-ai-provider-state"
      className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950"
    >
      <Bot className="h-5 w-5 text-blue-600" />
      <div className="flex-1">
        <p className="text-sm font-medium">No AI provider configured</p>
        <p className="text-xs text-muted-foreground">
          Configure an AI provider to auto-process raw workouts.
        </p>
      </div>
      <button
        type="button"
        onClick={show}
        className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Configure
      </button>
    </div>
  );
}
