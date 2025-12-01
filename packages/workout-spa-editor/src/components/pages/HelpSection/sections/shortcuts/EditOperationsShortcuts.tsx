/**
 * EditOperationsShortcuts Component
 *
 * Edit operation keyboard shortcuts.
 */

import { Copy, RotateCcw, Scissors } from "lucide-react";
import { ShortcutRow } from "../../components/ShortcutRow";

export function EditOperationsShortcuts() {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
        Edit Operations
      </h3>
      <div className="space-y-2">
        <ShortcutRow
          icon={<RotateCcw className="h-4 w-4" />}
          keys={["Ctrl", "Z"]}
          macKeys={["Cmd", "Z"]}
          description="Undo"
        />
        <ShortcutRow
          icon={<RotateCcw className="h-4 w-4 rotate-180" />}
          keys={["Ctrl", "Y"]}
          macKeys={["Cmd", "Y"]}
          description="Redo"
        />
        <ShortcutRow
          icon={<Copy className="h-4 w-4" />}
          keys={["Ctrl", "C"]}
          macKeys={["Cmd", "C"]}
          description="Copy selected steps"
        />
        <ShortcutRow
          icon={<Scissors className="h-4 w-4" />}
          keys={["Ctrl", "V"]}
          macKeys={["Cmd", "V"]}
          description="Paste steps"
        />
      </div>
    </div>
  );
}
