/**
 * Modified Indicator
 *
 * Visual indicator for MODIFIED state workouts.
 * Shows "Modified - needs re-push" with re-push button.
 */

import { AlertCircle, Upload } from "lucide-react";

import { Button } from "../../atoms/Button/Button";

type ModifiedIndicatorProps = {
  onRepush: () => void;
};

export function ModifiedIndicator({ onRepush }: ModifiedIndicatorProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 dark:border-amber-600 dark:bg-amber-900/20"
      data-testid="modified-indicator"
    >
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
        Modified &mdash; needs re-push
      </span>
      <Button size="sm" onClick={onRepush} className="ml-auto">
        <Upload className="mr-2 h-3 w-3" />
        Re-push to Garmin
      </Button>
    </div>
  );
}
