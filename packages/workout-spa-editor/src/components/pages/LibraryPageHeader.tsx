/**
 * Library Page Header
 *
 * Title and description for the library page (non-dialog variant).
 */

import { BookOpen } from "lucide-react";

export function LibraryPageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Workout Library
        </h1>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Browse, search, and schedule your saved workout templates.
      </p>
    </div>
  );
}
