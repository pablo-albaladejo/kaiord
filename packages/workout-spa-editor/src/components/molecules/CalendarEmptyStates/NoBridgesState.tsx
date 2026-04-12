/**
 * NoBridgesState - No bridge extensions installed.
 */

import { Plug } from "lucide-react";

export function NoBridgesState() {
  return (
    <div
      data-testid="no-bridges-state"
      className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950"
    >
      <Plug className="h-5 w-5 text-yellow-600" />
      <div>
        <p className="text-sm font-medium">No bridge extensions detected</p>
        <p className="text-xs text-muted-foreground">
          Install a bridge extension (e.g., Garmin Connect) to push workouts.
        </p>
      </div>
    </div>
  );
}
