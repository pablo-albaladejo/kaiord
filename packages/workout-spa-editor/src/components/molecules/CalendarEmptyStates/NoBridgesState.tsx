/**
 * NoBridgesState - No bridge extensions installed.
 */

import { Plug } from "lucide-react";

const BRIDGE_DOCS_URL = "https://kaiord.com/docs/bridges";

export function NoBridgesState() {
  return (
    <div
      data-testid="no-bridges-state"
      className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950"
    >
      <Plug className="h-5 w-5 text-yellow-600" />
      <div className="flex-1">
        <p className="text-sm font-medium">No bridge extensions detected</p>
        <p className="text-xs text-muted-foreground">
          Install a bridge extension (e.g., Garmin Connect) to push workouts.
        </p>
      </div>
      <a
        href={BRIDGE_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Learn more
      </a>
    </div>
  );
}
