/**
 * SelectionShortcuts Component
 *
 * Selection keyboard shortcuts.
 */

import { Zap } from "lucide-react";
import { ShortcutRow } from "../../components/ShortcutRow";

export function SelectionShortcuts() {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
        Selection
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<Zap className="h-4 w-4" />}
          keys={["Ctrl", "A"]}
          macKeys={["Cmd", "A"]}
          description="Select all steps"
        />
        <ShortcutRow
          icon={<Zap className="h-4 w-4" />}
          keys={["Esc"]}
          description="Clear selection"
        />
      </div>
    </div>
  );
}
