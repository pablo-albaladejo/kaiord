/**
 * StepManagementShortcuts Component
 *
 * Step management keyboard shortcuts.
 */

import { ArrowDown, ArrowUp, Layers } from "lucide-react";
import { ShortcutRow } from "../../components/ShortcutRow";

export function StepManagementShortcuts() {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
        Step Management
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<ArrowUp className="h-4 w-4" />}
          keys={["Alt", "↑"]}
          description="Move step up"
        />
        <ShortcutRow
          icon={<ArrowDown className="h-4 w-4" />}
          keys={["Alt", "↓"]}
          description="Move step down"
        />
        <ShortcutRow
          icon={<Layers className="h-4 w-4" />}
          keys={["Ctrl", "G"]}
          macKeys={["Cmd", "G"]}
          description="Create repetition block"
        />
        <ShortcutRow
          icon={<Layers className="h-4 w-4" />}
          keys={["Ctrl", "Shift", "G"]}
          macKeys={["Cmd", "Shift", "G"]}
          description="Ungroup block"
        />
      </div>
    </div>
  );
}
