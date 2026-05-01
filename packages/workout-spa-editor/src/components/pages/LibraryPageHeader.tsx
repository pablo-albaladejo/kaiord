/**
 * Library Page Header
 *
 * Title and description for the library page (non-dialog variant).
 *
 * The `<h1>` carries the `data-route-heading` attribute (via
 * `ROUTE_HEADING_ATTR`) and `tabIndex={-1}` so the focus-on-route-
 * change hook can move focus to it on navigation. The focus ring is
 * suppressed for non-keyboard activations via the global CSS rule
 * `[data-route-heading]:focus:not(:focus-visible) { outline: none }`.
 */

import { BookOpen } from "lucide-react";

import { ROUTE_HEADING_ATTR } from "../../routing/constants";

export function LibraryPageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-xl font-semibold text-gray-900 dark:text-white"
        >
          Workout Library
        </h1>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Browse, search, and schedule your saved workout templates.
      </p>
    </div>
  );
}
