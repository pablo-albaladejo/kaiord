/**
 * KeyboardShortcutsSection Component
 *
 * Keyboard shortcuts reference.
 */

import { Keyboard } from "lucide-react";
import { EditOperationsShortcuts } from "./shortcuts/EditOperationsShortcuts";
import { FileOperationsShortcuts } from "./shortcuts/FileOperationsShortcuts";
import { SelectionShortcuts } from "./shortcuts/SelectionShortcuts";
import { StepManagementShortcuts } from "./shortcuts/StepManagementShortcuts";

export function KeyboardShortcutsSection() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Keyboard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Keyboard Shortcuts
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FileOperationsShortcuts />
        <EditOperationsShortcuts />
        <StepManagementShortcuts />
        <SelectionShortcuts />
      </div>
    </div>
  );
}
