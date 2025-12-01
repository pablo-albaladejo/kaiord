/**
 * ImportExportActions Component
 *
 * Import/export buttons for profile management.
 */

import { Upload } from "lucide-react";

type ImportExportActionsProps = {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ImportExportActions({ onImport }: ImportExportActionsProps) {
  return (
    <div className="mb-4 flex gap-2">
      <label htmlFor="import-profile" className="cursor-pointer">
        <span className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
          <Upload className="mr-2 h-4 w-4" />
          Import Profile
        </span>
      </label>
      <input
        id="import-profile"
        type="file"
        accept=".json"
        onChange={onImport}
        className="sr-only"
        aria-label="Import profile file"
      />
    </div>
  );
}
