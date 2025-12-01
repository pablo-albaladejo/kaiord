/**
 * FileOperationsShortcuts Component
 *
 * File operation keyboard shortcuts.
 */

import { Save } from "lucide-react";
import { ShortcutRow } from "../../components/ShortcutRow";

export function FileOperationsShortcuts() {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
        File Operations
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<Save className="h-4 w-4" />}
          keys={["Ctrl", "S"]}
          macKeys={["Cmd", "S"]}
          description="Save workout"
        />
      </div>
    </div>
  );
}
